package com.kirana.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SupplierResponse(
        Long id,
        String name,
        String contactPerson,
        String phoneNumber,
        String email,
        String companyBrand,
        BigDecimal pendingPayable,
        LocalDateTime lastDeliveryDate
) {}
