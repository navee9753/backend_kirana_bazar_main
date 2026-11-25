package com.kirana.inventory.service;

import com.kirana.inventory.dto.KhataCheckoutCreditRequest;
import com.kirana.inventory.dto.KhataTransactionRequest;
import com.kirana.inventory.model.KhataCustomer;
import com.kirana.inventory.model.KhataTransaction;
import com.kirana.inventory.model.KhataTransactionType;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.repository.KhataCustomerRepository;
import com.kirana.inventory.repository.KhataTransactionRepository;
import com.kirana.inventory.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KhataLedgerServiceTest {

    @Mock
    private KhataCustomerRepository customerRepository;
    @Mock
    private KhataTransactionRepository transactionRepository;
    @Mock
    private ProductRepository productRepository;
    @InjectMocks
    private KhataLedgerService service;

    @Test
    void paymentReceiptAppendsTransactionAndReducesBalance() {
        KhataCustomer customer = customer(10L, "250.00");
        when(customerRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(KhataCustomer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.recordTransaction(10L, new KhataTransactionRequest(
                KhataTransactionType.PAYMENT_RECEIVED,
                new BigDecimal("75.00"),
                "Paid via PhonePe"
        ));

        assertEquals(new BigDecimal("175.00"), customer.getOutstandingBalance());
        ArgumentCaptor<KhataTransaction> transaction = ArgumentCaptor.forClass(KhataTransaction.class);
        verify(transactionRepository).save(transaction.capture());
        assertEquals(KhataTransactionType.PAYMENT_RECEIVED, transaction.getValue().getTransactionType());
        assertEquals(new BigDecimal("75.00"), transaction.getValue().getAmount());
        assertEquals("Paid via PhonePe", transaction.getValue().getNotes());
    }

    @Test
    void creditCheckoutDeductsStockAndAppendsUdharTransaction() {
        KhataCustomer customer = customer(10L, "100.00");
        Product product = new Product();
        product.setId(5L);
        product.setCurrentStock(new BigDecimal("4.000"));
        when(customerRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(customer));
        when(productRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(product));
        when(customerRepository.save(any(KhataCustomer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.checkoutOnCredit(new KhataCheckoutCreditRequest(
                10L,
                new BigDecimal("45.50"),
                "Rice x 2",
                List.of(new KhataCheckoutCreditRequest.CartItem(5L, new BigDecimal("2.000")))
        ));

        assertEquals(new BigDecimal("2.000"), product.getCurrentStock());
        assertEquals(new BigDecimal("145.50"), customer.getOutstandingBalance());
        ArgumentCaptor<KhataTransaction> transaction = ArgumentCaptor.forClass(KhataTransaction.class);
        verify(transactionRepository).save(transaction.capture());
        assertEquals(KhataTransactionType.UDHAR_GIVEN, transaction.getValue().getTransactionType());
        assertEquals("POS Bill: Rice x 2", transaction.getValue().getNotes());
        verify(productRepository).saveAll(List.of(product));
    }

    @Test
    void creditCheckoutRejectsInsufficientStockWithoutSavingLedgerChanges() {
        KhataCustomer customer = customer(10L, "100.00");
        Product product = new Product();
        product.setId(5L);
        product.setCurrentStock(new BigDecimal("1.000"));
        when(customerRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(customer));
        when(productRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(product));

        assertThrows(ResponseStatusException.class, () -> service.checkoutOnCredit(
                new KhataCheckoutCreditRequest(
                        10L,
                        new BigDecimal("45.50"),
                        "Rice x 2",
                        List.of(new KhataCheckoutCreditRequest.CartItem(5L, new BigDecimal("2.000")))
                )
        ));

        assertEquals(new BigDecimal("100.00"), customer.getOutstandingBalance());
        verify(productRepository, never()).saveAll(any());
        verify(transactionRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
    }

    private KhataCustomer customer(Long id, String balance) {
        KhataCustomer customer = new KhataCustomer();
        customer.setId(id);
        customer.setCustomerName("Test Customer");
        customer.setOutstandingBalance(new BigDecimal(balance));
        return customer;
    }
}
