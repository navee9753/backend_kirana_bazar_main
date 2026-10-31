package com.kirana.inventory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is required")
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "brand")
    private String brand;

    @Column(name = "category")
    private String category;

    @PositiveOrZero(message = "Current stock cannot be negative")
    @Column(name = "current_stock")
    private Integer currentStock;

    @PositiveOrZero(message = "Minimum stock alert cannot be negative")
    @Column(name = "min_stock_alert")
    private Integer minStockAlert;

    @DecimalMin(value = "0.0", inclusive = true, message = "Purchase price cannot be negative")
    @Column(name = "purchase_price", nullable = false)
    private BigDecimal purchasePrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "MRP cannot be negative")
    @Column(name = "mrp", nullable = false)
    private BigDecimal mrp;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final Product product = new Product();

        public Builder id(Long id) {
            product.setId(id);
            return this;
        }

        public Builder name(String name) {
            product.setName(name);
            return this;
        }

        public Builder brand(String brand) {
            product.setBrand(brand);
            return this;
        }

        public Builder category(String category) {
            product.setCategory(category);
            return this;
        }

        public Builder currentStock(Integer currentStock) {
            product.setCurrentStock(currentStock);
            return this;
        }

        public Builder minStockAlert(Integer minStockAlert) {
            product.setMinStockAlert(minStockAlert);
            return this;
        }

        public Builder purchasePrice(BigDecimal purchasePrice) {
            product.setPurchasePrice(purchasePrice);
            return this;
        }

        public Builder mrp(BigDecimal mrp) {
            product.setMrp(mrp);
            return this;
        }

        public Product build() {
            return product;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Integer getMinStockAlert() {
        return minStockAlert;
    }

    public void setMinStockAlert(Integer minStockAlert) {
        this.minStockAlert = minStockAlert;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public BigDecimal getMrp() {
        return mrp;
    }

    public void setMrp(BigDecimal mrp) {
        this.mrp = mrp;
    }
}
