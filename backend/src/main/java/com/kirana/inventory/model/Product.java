package com.kirana.inventory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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
    @Digits(integer = 9, fraction = 3, message = "Current stock must fit NUMERIC(12,3)")
    @Column(name = "current_stock", precision = 12, scale = 3)
    private BigDecimal currentStock;

    @PositiveOrZero(message = "Minimum stock alert cannot be negative")
    @Digits(integer = 9, fraction = 3, message = "Minimum stock alert must fit NUMERIC(12,3)")
    @Column(name = "min_stock_alert", precision = 12, scale = 3)
    private BigDecimal minStockAlert;

    @Column(name = "is_loose_item", nullable = false)
    private Boolean isLooseItem = false;

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

        public Builder currentStock(BigDecimal currentStock) {
            product.setCurrentStock(currentStock);
            return this;
        }

        public Builder currentStock(int currentStock) {
            return currentStock(BigDecimal.valueOf(currentStock));
        }

        public Builder minStockAlert(BigDecimal minStockAlert) {
            product.setMinStockAlert(minStockAlert);
            return this;
        }

        public Builder minStockAlert(int minStockAlert) {
            return minStockAlert(BigDecimal.valueOf(minStockAlert));
        }

        public Builder isLooseItem(Boolean isLooseItem) {
            product.setIsLooseItem(isLooseItem);
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

    public BigDecimal getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
    }

    public BigDecimal getMinStockAlert() {
        return minStockAlert;
    }

    public void setMinStockAlert(BigDecimal minStockAlert) {
        this.minStockAlert = minStockAlert;
    }

    public Boolean getIsLooseItem() {
        return isLooseItem;
    }

    public void setIsLooseItem(Boolean isLooseItem) {
        this.isLooseItem = isLooseItem;
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
