package com.kirana.inventory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SupplierRequest(
        @NotBlank(message = "Supplier name is required")
        @Size(max = 255)
        String name,

        @Size(max = 150)
        String contactPerson,

        @NotBlank(message = "Phone number is required")
        @Size(max = 15)
        String phoneNumber,

        @Email(message = "Please provide a valid email")
        @Size(max = 255)
        String email,

        @Size(max = 150)
        String companyBrand,

        @Digits(integer = 12, fraction = 2)
        BigDecimal pendingPayable,

        LocalDateTime lastDeliveryDate
) {}
