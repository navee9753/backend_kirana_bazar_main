package com.kirana.inventory.service;

import com.kirana.inventory.dto.DashboardSummary;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.repository.KhataRepository;
import com.kirana.inventory.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

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
}
