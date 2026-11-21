package com.kirana.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record SupplierPurchaseRequest(
        @NotNull(message = "Product ID is required")
        @Positive(message = "Product ID must be positive")
        Long productId,

        @NotNull(message = "Quantity purchased is required")
        @Positive(message = "Quantity purchased must be positive")
        @Digits(integer = 9, fraction = 3, message = "Quantity purchased must fit NUMERIC(12,3)")
        BigDecimal quantityPurchased,

        @NotNull(message = "Purchase rate is required")
        @DecimalMin(value = "0.00", message = "Purchase rate cannot be negative")
        @Digits(integer = 8, fraction = 2, message = "Purchase rate must fit NUMERIC(10,2)")
        BigDecimal purchaseRate
) {}
