package com.kirana.inventory.service;

import com.kirana.inventory.dto.SupplierRequest;
import com.kirana.inventory.dto.SupplierResponse;
import com.kirana.inventory.dto.SupplierPurchaseRequest;
import com.kirana.inventory.dto.SupplierPurchaseResponse;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.model.Supplier;
import com.kirana.inventory.model.SupplierPurchase;
import com.kirana.inventory.repository.ProductRepository;
import com.kirana.inventory.repository.SupplierPurchaseRepository;
import com.kirana.inventory.repository.SupplierRepository;
import com.kirana.inventory.util.FileImportHelper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final SupplierPurchaseRepository supplierPurchaseRepository;

    public SupplierService(
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            SupplierPurchaseRepository supplierPurchaseRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.supplierPurchaseRepository = supplierPurchaseRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAllByOrderByIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.name().trim());
        supplier.setContactPerson(trimToNull(request.contactPerson()));
        supplier.setPhoneNumber(request.phoneNumber().trim());
        supplier.setEmail(trimToNull(request.email()));
        supplier.setCompanyBrand(trimToNull(request.companyBrand()));
        supplier.setPendingPayable(request.pendingPayable() == null ? BigDecimal.ZERO : request.pendingPayable());
        supplier.setLastDeliveryDate(request.lastDeliveryDate());
        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierPurchaseResponse recordPurchase(Long supplierId, SupplierPurchaseRequest request) {
        Product product = productRepository.findByIdForUpdate(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        Supplier supplier = supplierRepository.findByIdForUpdate(supplierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));

        BigDecimal totalAmount = request.purchaseRate()
                .multiply(BigDecimal.valueOf(request.quantityPurchased()))
                .setScale(2);
        if (totalAmount.precision() - totalAmount.scale() > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total amount exceeds NUMERIC(14,2)");
        }

        int currentStock = product.getCurrentStock() == null ? 0 : product.getCurrentStock();
        final int updatedStock;
        try {
            updatedStock = Math.addExact(currentStock, request.quantityPurchased());
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Updated product stock exceeds the supported range", exception);
        }
        BigDecimal updatedPendingPayable = (supplier.getPendingPayable() == null
                ? BigDecimal.ZERO
                : supplier.getPendingPayable()).add(totalAmount);
        if (updatedPendingPayable.precision() - updatedPendingPayable.scale() > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Updated supplier payable exceeds NUMERIC(14,2)");
        }

        SupplierPurchase purchase = new SupplierPurchase();
        purchase.setSupplier(supplier);
        purchase.setProduct(product);
        purchase.setQuantityPurchased(request.quantityPurchased());
        purchase.setPurchaseRate(request.purchaseRate());
        purchase.setTotalAmount(totalAmount);

        product.setCurrentStock(updatedStock);
        supplier.setPendingPayable(updatedPendingPayable);

        SupplierPurchase savedPurchase = supplierPurchaseRepository.save(purchase);
        productRepository.save(product);
        supplierRepository.save(supplier);
        return toPurchaseResponse(savedPurchase);
    }

    @Transactional(readOnly = true)
    public List<SupplierPurchaseResponse> getSupplierPurchases(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found");
        }
        return supplierPurchaseRepository.findBySupplierId(supplierId).stream()
                .map(this::toPurchaseResponse)
                .toList();
    }

    @Transactional
    public int importSuppliers(MultipartFile file) {
        List<String[]> rows = FileImportHelper.parseFile(file);
        Map<String, Integer> columns = headerColumns(rows);
        requireHeaders(columns, Set.of("name", "phone_number"));

        int imported = 0;
        for (int rowIndex = 1; rowIndex < rows.size(); rowIndex++) {
            String[] row = rows.get(rowIndex);
            if (isEmptyRow(row)) {
                continue;
            }

            int csvRow = rowIndex + 1;
            Supplier supplier = new Supplier();
            supplier.setName(requiredCell(row, columns, "name", csvRow, 255));
            supplier.setContactPerson(optionalCell(row, columns, "contact_person", 150, csvRow));
            supplier.setPhoneNumber(requiredCell(row, columns, "phone_number", csvRow, 15));
            supplier.setEmail(optionalEmail(row, columns, csvRow));
            supplier.setCompanyBrand(optionalCell(row, columns, "company_brand", 150, csvRow));
            supplier.setPendingPayable(optionalMoney(row, columns, csvRow));
            supplierRepository.save(supplier);
            imported++;
        }

        if (imported == 0) {
            throw new IllegalArgumentException("The supplier import contains no data rows.");
        }
        return imported;
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getContactPerson(),
                supplier.getPhoneNumber(),
                supplier.getEmail(),
                supplier.getCompanyBrand(),
                supplier.getPendingPayable() == null ? BigDecimal.ZERO : supplier.getPendingPayable(),
                supplier.getLastDeliveryDate()
        );
    }

    private SupplierPurchaseResponse toPurchaseResponse(SupplierPurchase purchase) {
        return new SupplierPurchaseResponse(
                purchase.getId(),
                purchase.getSupplier().getId(),
                purchase.getProduct().getId(),
                purchase.getQuantityPurchased(),
                purchase.getPurchaseRate(),
                purchase.getTotalAmount(),
                purchase.getPurchaseDate()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Map<String, Integer> headerColumns(List<String[]> rows) {
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("The uploaded file does not contain a header row.");
        }

        Set<String> supportedHeaders = Set.of(
                "name", "contact_person", "phone_number", "email", "company_brand", "pending_payable"
        );
        Map<String, Integer> columns = new HashMap<>();
        String[] header = rows.get(0);
        for (int index = 0; index < header.length; index++) {
            String normalized = header[index] == null ? "" : header[index].trim().toLowerCase(Locale.ROOT);
            if (normalized.isEmpty()) {
                continue;
            }
            if (columns.putIfAbsent(normalized, index) != null) {
                throw new IllegalArgumentException("Duplicate column header: " + normalized);
            }
            if (!supportedHeaders.contains(normalized)) {
                throw new IllegalArgumentException("Unsupported supplier column header: " + normalized);
            }
        }
        return columns;
    }

    private void requireHeaders(Map<String, Integer> columns, Set<String> requiredHeaders) {
        List<String> missing = requiredHeaders.stream().filter(header -> !columns.containsKey(header)).toList();
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Missing required supplier column(s): " + String.join(", ", missing));
        }
    }

    private boolean isEmptyRow(String[] row) {
        return row == null || java.util.Arrays.stream(row).allMatch(value -> value == null || value.isBlank());
    }

    private String cell(String[] row, Map<String, Integer> columns, String column) {
        Integer index = columns.get(column);
        return index == null || index >= row.length || row[index] == null ? "" : row[index].trim();
    }

    private String requiredCell(String[] row, Map<String, Integer> columns, String column, int csvRow, int maxLength) {
        String value = cell(row, columns, column);
        if (value.isBlank()) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " is required.");
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " cannot exceed " + maxLength + " characters.");
        }
        return value;
    }

    private String optionalCell(String[] row, Map<String, Integer> columns, String column, int maxLength, int csvRow) {
        String value = cell(row, columns, column);
        if (value.isBlank()) {
            return null;
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " cannot exceed " + maxLength + " characters.");
        }
        return value;
    }

    private String optionalEmail(String[] row, Map<String, Integer> columns, int csvRow) {
        String email = optionalCell(row, columns, "email", 255, csvRow);
        if (email != null && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Row " + csvRow + ": email must be a valid email address.");
        }
        return email;
    }

    private BigDecimal optionalMoney(String[] row, Map<String, Integer> columns, int csvRow) {
        String value = cell(row, columns, "pending_payable");
        if (value.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            BigDecimal amount = new BigDecimal(value);
            if (amount.signum() < 0 || amount.scale() > 2 || amount.precision() - amount.scale() > 12) {
                throw new IllegalArgumentException("Row " + csvRow + ": pending_payable must be non-negative and fit NUMERIC(14,2).");
            }
            return amount;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Row " + csvRow + ": pending_payable must be a valid decimal amount.", exception);
        }
    }
}
