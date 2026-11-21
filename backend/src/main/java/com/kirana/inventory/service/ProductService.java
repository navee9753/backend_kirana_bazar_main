package com.kirana.inventory.service;

import com.kirana.inventory.dto.DashboardSummary;
import com.kirana.inventory.dto.StockDeductionRequest;
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
import java.util.LinkedHashMap;
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
                .filter(product -> product.getCurrentStock().compareTo(product.getMinStockAlert()) <= 0)
                .count();

        BigDecimal inventoryValue = products.stream()
                .map(product -> {
                    BigDecimal mrp = product.getMrp() == null ? BigDecimal.ZERO : product.getMrp();
                    BigDecimal stock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
                    return mrp.multiply(stock);
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
        if (product.getIsLooseItem() == null) {
            product.setIsLooseItem(false);
        }
        return productRepository.save(product);
    }

    @Transactional
    public int importProducts(MultipartFile file) {
        List<String[]> rows = FileImportHelper.parseFile(file);
        Map<String, Integer> columns = headerColumns(rows, Set.of(
                "name", "brand", "category", "current_stock", "min_stock_alert", "purchase_price", "mrp", "is_loose_item"
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
            product.setCurrentStock(optionalStock(row, columns, "current_stock", BigDecimal.ZERO, csvRow));
            product.setMinStockAlert(optionalStock(row, columns, "min_stock_alert", new BigDecimal("5.000"), csvRow));
            product.setIsLooseItem(optionalBoolean(row, columns, "is_loose_item", false, csvRow));
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
        existing.setIsLooseItem(product.getIsLooseItem() == null ? false : product.getIsLooseItem());
        existing.setPurchasePrice(product.getPurchasePrice());
        existing.setMrp(product.getMrp());
        return productRepository.save(existing);
    }

    @Transactional
    public void deductStocks(List<StockDeductionRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one product is required");
        }

        Map<Long, BigDecimal> quantities = new LinkedHashMap<>();
        for (StockDeductionRequest item : items) {
            if (quantities.putIfAbsent(item.productId(), item.quantity()) != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each product may appear only once per bill");
            }
        }

        Map<Product, BigDecimal> updatedStocks = new LinkedHashMap<>();
        for (Long productId : quantities.keySet().stream().sorted().toList()) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId));
            BigDecimal currentStock = product.getCurrentStock() == null ? BigDecimal.ZERO : product.getCurrentStock();
            BigDecimal quantity = quantities.get(productId);
            if (currentStock.compareTo(quantity) < 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for product: " + productId);
            }
            updatedStocks.put(product, currentStock.subtract(quantity));
        }

        updatedStocks.forEach(Product::setCurrentStock);
        productRepository.saveAll(updatedStocks.keySet());
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

    private BigDecimal optionalStock(String[] row, Map<String, Integer> columns, String column, BigDecimal defaultValue, int csvRow) {
        String value = cell(row, columns, column);
        if (value.isBlank()) {
            return defaultValue;
        }
        try {
            BigDecimal parsed = new BigDecimal(value);
            if (parsed.signum() < 0 || parsed.scale() > 3 || parsed.precision() - parsed.scale() > 9) {
                throw new IllegalArgumentException("Row " + csvRow + ": " + column + " must be non-negative and fit NUMERIC(12,3).");
            }
            return parsed;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Row " + csvRow + ": " + column + " must be a non-negative decimal with at most 3 decimal places.", exception);
        }
    }

    private boolean optionalBoolean(String[] row, Map<String, Integer> columns, String column, boolean defaultValue, int csvRow) {
        String value = cell(row, columns, column);
        if (value.isBlank()) {
            return defaultValue;
        }
        if ("true".equalsIgnoreCase(value) || "1".equals(value) || "yes".equalsIgnoreCase(value)) {
            return true;
        }
        if ("false".equalsIgnoreCase(value) || "0".equals(value) || "no".equalsIgnoreCase(value)) {
            return false;
        }
        throw new IllegalArgumentException("Row " + csvRow + ": " + column + " must be true or false.");
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
