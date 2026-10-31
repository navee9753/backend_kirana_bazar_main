package com.kirana.inventory.dto;

import java.math.BigDecimal;

public class DashboardSummary {
    private int totalProducts;
    private int lowStockCount;
    private BigDecimal inventoryValue;
    private BigDecimal totalKhataOutstanding;
    private long totalKhataEntries;

    public int getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(int totalProducts) {
        this.totalProducts = totalProducts;
    }

    public int getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(int lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public BigDecimal getInventoryValue() {
        return inventoryValue;
    }

    public void setInventoryValue(BigDecimal inventoryValue) {
        this.inventoryValue = inventoryValue;
    }

    public BigDecimal getTotalKhataOutstanding() {
        return totalKhataOutstanding;
    }

    public void setTotalKhataOutstanding(BigDecimal totalKhataOutstanding) {
        this.totalKhataOutstanding = totalKhataOutstanding;
    }

    public long getTotalKhataEntries() {
        return totalKhataEntries;
    }

    public void setTotalKhataEntries(long totalKhataEntries) {
        this.totalKhataEntries = totalKhataEntries;
    }
}
