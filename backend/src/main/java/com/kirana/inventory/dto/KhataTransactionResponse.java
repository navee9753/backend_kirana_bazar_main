package com.kirana.inventory.dto;

import com.kirana.inventory.model.KhataTransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record KhataTransactionResponse(
        Long id,
        Long customerId,
        KhataTransactionType transactionType,
        BigDecimal amount,
        String notes,
        LocalDateTime transactionDate
) {
}
