package com.kirana.inventory.controller;

import com.kirana.inventory.dto.DashboardSummary;
import com.kirana.inventory.dto.BulkImportResponse;
import com.kirana.inventory.dto.StockDeductionBatchRequest;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping(value = "/products/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportProducts() {
        byte[] csv = ("\uFEFF" + productService.exportProductsCsv()).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"kirana-inventory.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }

    @GetMapping("/products/low-stock")
    public List<Product> getLowStockProducts() {
        return productService.getLowStockProducts();
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummary getDashboardSummary() {
        return productService.getDashboardSummary();
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product savedProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PostMapping("/products/import")
    public ResponseEntity<BulkImportResponse> importProducts(@RequestParam("file") MultipartFile file) {
        try {
            int importedCount = productService.importProducts(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(new BulkImportResponse(importedCount));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product product) {
        Product updatedProduct = productService.updateProduct(id, product);
        return ResponseEntity.ok(updatedProduct);
    }

    @PostMapping("/checkout/stock-deductions")
    public ResponseEntity<Void> deductCheckoutStock(@Valid @RequestBody StockDeductionBatchRequest request) {
        productService.deductStocks(request.items());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
