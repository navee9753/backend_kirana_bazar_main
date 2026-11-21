package com.kirana.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record StockDeductionBatchRequest(
        @NotEmpty(message = "At least one product is required")
        List<@Valid StockDeductionRequest> items
) {}
