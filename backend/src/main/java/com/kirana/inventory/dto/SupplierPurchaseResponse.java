package com.kirana.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SupplierPurchaseResponse(
        Long id,
        Long supplierId,
        Long productId,
        int quantityPurchased,
        BigDecimal purchaseRate,
        BigDecimal totalAmount,
        LocalDateTime purchaseDate
) {}
