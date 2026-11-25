package com.kirana.inventory.dto;

import com.kirana.inventory.model.KhataTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record KhataTransactionRequest(
        @NotNull KhataTransactionType transactionType,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
        @Size(max = 2000) String notes
) {
}
