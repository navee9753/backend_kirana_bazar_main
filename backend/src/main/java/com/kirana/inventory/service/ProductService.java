package com.kirana.inventory.service;

import com.kirana.inventory.dto.DashboardSummary;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.repository.KhataRepository;
import com.kirana.inventory.repository.ProductRepository;
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
public class ProductService {

    private final ProductRepository productRepository;
    private final KhataRepository khataRepository;

    public ProductService(ProductRepository productRepository, KhataRepository khataRepository) {
        this.productRepository = productRepository;
        this.khataRepository = khataRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    public DashboardSummary getDashboardSummary() {
        List<Product> products = productRepository.findAll();
        long lowStockCount = products.stream()
                .filter(product -> product.getCurrentStock() != null && product.getMinStockAlert() != null)
                .filter(product -> product.getCurrentStock() <= product.getMinStockAlert())
                .count();

        BigDecimal inventoryValue = products.stream()
                .map(product -> {
                    BigDecimal mrp = product.getMrp() == null ? BigDecimal.ZERO : product.getMrp();
                    int stock = product.getCurrentStock() == null ? 0 : product.getCurrentStock();
                    return mrp.multiply(BigDecimal.valueOf(stock));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardSummary summary = new DashboardSummary();
        summary.setTotalProducts(products.size());
        summary.setLowStockCount((int) lowStockCount);
        summary.setInventoryValue(inventoryValue);
        summary.setTotalKhataOutstanding(khataRepository.getTotalOutstandingBalance());
        summary.setTotalKhataEntries(khataRepository.count());
        return summary;
    }

    public Product createProduct(Product product) {
        if (product == null || product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }

        product.setName(product.getName().trim());
        return productRepository.save(product);
    }

    @Transactional
    public int importProducts(MultipartFile file) {
        List<String[]> rows = FileImportHelper.parseFile(file);
        Map<String, Integer> columns = headerColumns(rows, Set.of(
                "name", "brand", "category", "current_stock", "min_stock_alert", "purchase_price", "mrp"
        ));
        requireHeaders(columns, Set.of("name", "purchase_price", "mrp"), "products");

        int imported = 0;
        for (int rowIndex = 1; rowIndex < rows.size(); rowIndex++) {
            String[] row = rows.get(rowIndex);
            if (isEmptyRow(row)) {
                continue;
            }

            int csvRow = rowIndex + 1;
            Product product = new Product();
            product.setName(requiredCell(row, columns, "name", csvRow, 255));
            product.setBrand(optionalCell(row, columns, "brand", 100, csvRow));
            product.setCategory(optionalCell(row, columns, "category", 100, csvRow));
            product.setCurrentStock(optionalInteger(row, columns, "current_stock", 0, csvRow));
            product.setMinStockAlert(optionalInteger(row, columns, "min_stock_alert", 5, csvRow));
            product.setPurchasePrice(requiredMoney(row, columns, "purchase_price", csvRow, 8));
            product.setMrp(requiredMoney(row, columns, "mrp", csvRow, 8));
            productRepository.save(product);
            imported++;
        }

        if (imported == 0) {
            throw new IllegalArgumentException("The product import contains no data rows.");
        }
        return imported;
    }

    public Product updateProduct(Long id, Product product) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product == null || product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }

        existing.setName(product.getName().trim());
        existing.setBrand(product.getBrand());
        existing.setCategory(product.getCategory());
        existing.setCurrentStock(product.getCurrentStock());
        existing.setMinStockAlert(product.getMinStockAlert());
        existing.setPurchasePrice(product.getPurchasePrice());
        existing.setMrp(product.getMrp());
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        productRepository.delete(existing);
    }

    private Map<String, Integer> headerColumns(List<String[]> rows, Set<String> supportedHeaders) {
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("The uploaded file does not contain a header row.");
        }

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
                throw new IllegalArgumentException("Unsupported product column header: " + normalized);
            }
        }
        return columns;
    }

    private void requireHeaders(Map<String, Integer> columns, Set<String> requiredHeaders, String kind) {
        List<String> missing = requiredHeaders.stream().filter(header -> !columns.containsKey(header)).toList();
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Missing required " + kind + " column(s): " + String.join(", ", missing));
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

    private Integer optionalInteger(String[] row, Map<String, Integer> columns, String column, int defaultValue, int csvRow) {
        String value = cell(row, columns, column);
        if (value.isBlank()) {
            return defaultValue;
        }
        try {
            int parsed = Integer.parseInt(value);
            if (parsed < 0) {
                throw new IllegalArgumentException("Row " + csvRow + ": " + column + " cannot be negative.");
            }
            return parsed;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " must be a whole number.", exception);
        }
    }

    private BigDecimal requiredMoney(String[] row, Map<String, Integer> columns, String column, int csvRow, int maxIntegerDigits) {
        String value = cell(row, columns, column);
        if (value.isBlank()) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " is required.");
        }
        try {
            BigDecimal amount = new BigDecimal(value);
            if (amount.signum() < 0 || amount.scale() > 2 || amount.precision() - amount.scale() > maxIntegerDigits) {
                throw new IllegalArgumentException("Row " + csvRow + ": " + column + " must be non-negative and fit the database precision.");
            }
            return amount;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " must be a valid decimal amount.", exception);
        }
    }
}
