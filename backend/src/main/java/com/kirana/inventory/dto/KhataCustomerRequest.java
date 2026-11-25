package com.kirana.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record KhataCustomerRequest(
        @NotBlank @Size(max = 255) String customerName,
        @NotBlank @Pattern(regexp = "\\d{10,15}", message = "Phone number must contain 10 to 15 digits")
        String phoneNumber,
        @Size(max = 2000) String address,
        @DecimalMin(value = "0.00") @Digits(integer = 12, fraction = 2) BigDecimal creditLimit
) {
}
