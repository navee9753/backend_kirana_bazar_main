package com.kirana.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record KhataCustomerResponse(
        Long id,
        String customerName,
        String phoneNumber,
        String address,
        BigDecimal creditLimit,
        BigDecimal outstandingBalance,
        LocalDateTime lastUpdated
) {
}
