package com.kirana.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record KhataCheckoutCreditRequest(
        @NotNull @Positive Long customerId,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 12, fraction = 2) BigDecimal totalAmount,
        @NotBlank @Size(max = 2000) String itemsSummary,
        @NotEmpty List<@Valid CartItem> cartItems
) {
    public record CartItem(
            @NotNull @Positive Long productId,
            @NotNull @DecimalMin(value = "0.001") @Digits(integer = 9, fraction = 3) BigDecimal quantity
    ) {
    }
}
