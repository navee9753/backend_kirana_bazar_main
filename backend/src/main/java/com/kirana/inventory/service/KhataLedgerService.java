package com.kirana.inventory.service;

import com.kirana.inventory.dto.KhataCheckoutCreditRequest;
import com.kirana.inventory.dto.KhataCustomerRequest;
import com.kirana.inventory.dto.KhataCustomerResponse;
import com.kirana.inventory.dto.KhataTransactionRequest;
import com.kirana.inventory.dto.KhataTransactionResponse;
import com.kirana.inventory.model.KhataCustomer;
import com.kirana.inventory.model.KhataTransaction;
import com.kirana.inventory.model.KhataTransactionType;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.repository.KhataCustomerRepository;
import com.kirana.inventory.repository.KhataTransactionRepository;
import com.kirana.inventory.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class KhataLedgerService {

    private final KhataCustomerRepository customerRepository;
    private final KhataTransactionRepository transactionRepository;
    private final ProductRepository productRepository;

    public KhataLedgerService(
            KhataCustomerRepository customerRepository,
            KhataTransactionRepository transactionRepository,
            ProductRepository productRepository
    ) {
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<KhataCustomerResponse> getCustomers() {
        return customerRepository.findAllByOrderByOutstandingBalanceDesc()
                .stream()
                .map(this::toCustomerResponse)
                .toList();
    }

    @Transactional
    public KhataCustomerResponse createCustomer(KhataCustomerRequest request) {
        String phoneNumber = request.phoneNumber().trim();
        if (customerRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A customer with this phone number already exists");
        }

        KhataCustomer customer = new KhataCustomer();
        customer.setCustomerName(request.customerName().trim());
        customer.setPhoneNumber(phoneNumber);
        customer.setAddress(cleanOptionalText(request.address()));
        customer.setCreditLimit(request.creditLimit() == null
                ? new BigDecimal("5000.00")
                : request.creditLimit());
        customer.setOutstandingBalance(BigDecimal.ZERO);
        return toCustomerResponse(customerRepository.save(customer));
    }

    @Transactional(readOnly = true)
    public List<KhataTransactionResponse> getTransactions(Long customerId) {
        requireCustomer(customerId);
        return transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    @Transactional
    public KhataCustomerResponse recordTransaction(Long customerId, KhataTransactionRequest request) {
        KhataCustomer customer = lockCustomer(customerId);
        validateAmount(request.amount());
        applyBalanceChange(customer, request.transactionType(), request.amount());

        KhataTransaction transaction = new KhataTransaction();
        transaction.setCustomer(customer);
        transaction.setTransactionType(request.transactionType());
        transaction.setAmount(request.amount());
        transaction.setNotes(cleanOptionalText(request.notes()));
        transactionRepository.save(transaction);

        return toCustomerResponse(customerRepository.save(customer));
    }

    @Transactional
    public KhataCustomerResponse checkoutOnCredit(KhataCheckoutCreditRequest request) {
        KhataCustomer customer = lockCustomer(request.customerId());
        validateAmount(request.totalAmount());
        Map<Long, BigDecimal> quantities = aggregateCartItems(request.cartItems());
        List<Product> products = new ArrayList<>();

        for (Long productId : quantities.keySet().stream().sorted().toList()) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Product not found: " + productId));
            BigDecimal stock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
            BigDecimal quantity = quantities.get(productId);
            if (stock.compareTo(quantity) < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Insufficient stock for product: " + productId);
            }
            product.setCurrentStock(stock.subtract(quantity));
            products.add(product);
        }

        productRepository.saveAll(products);
        applyBalanceChange(customer, KhataTransactionType.UDHAR_GIVEN, request.totalAmount());

        KhataTransaction transaction = new KhataTransaction();
        transaction.setCustomer(customer);
        transaction.setTransactionType(KhataTransactionType.UDHAR_GIVEN);
        transaction.setAmount(request.totalAmount());
        transaction.setNotes("POS Bill: " + request.itemsSummary().trim());
        transactionRepository.save(transaction);

        return toCustomerResponse(customerRepository.save(customer));
    }

    private Map<Long, BigDecimal> aggregateCartItems(List<KhataCheckoutCreditRequest.CartItem> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one cart item is required");
        }
        Map<Long, BigDecimal> quantities = new LinkedHashMap<>();
        for (KhataCheckoutCreditRequest.CartItem item : items) {
            if (item.productId() == null || item.quantity() == null || item.quantity().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart items require a product and positive quantity");
            }
            quantities.merge(item.productId(), item.quantity(), BigDecimal::add);
        }
        return quantities;
    }

    private void applyBalanceChange(
            KhataCustomer customer,
            KhataTransactionType transactionType,
            BigDecimal amount
    ) {
        if (transactionType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction type is required");
        }
        BigDecimal balance = customer.getOutstandingBalance() == null
                ? BigDecimal.ZERO
                : customer.getOutstandingBalance();
        BigDecimal updatedBalance = switch (transactionType) {
            case UDHAR_GIVEN -> balance.add(amount);
            case PAYMENT_RECEIVED -> balance.subtract(amount);
        };
        customer.setOutstandingBalance(updatedBalance);
        customer.setLastUpdated(LocalDateTime.now());
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }
    }

    private KhataCustomer requireCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khata customer not found"));
    }

    private KhataCustomer lockCustomer(Long customerId) {
        return customerRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khata customer not found"));
    }

    private KhataCustomerResponse toCustomerResponse(KhataCustomer customer) {
        return new KhataCustomerResponse(
                customer.getId(),
                customer.getCustomerName(),
                customer.getPhoneNumber(),
                customer.getAddress(),
                customer.getCreditLimit(),
                customer.getOutstandingBalance(),
                customer.getLastUpdated()
        );
    }

    private KhataTransactionResponse toTransactionResponse(KhataTransaction transaction) {
        return new KhataTransactionResponse(
                transaction.getId(),
                transaction.getCustomer().getId(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getNotes(),
                transaction.getTransactionDate()
        );
    }

    private String cleanOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
