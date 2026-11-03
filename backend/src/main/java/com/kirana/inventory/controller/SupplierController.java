package com.kirana.inventory.controller;

import com.kirana.inventory.dto.BulkImportResponse;
import com.kirana.inventory.dto.SupplierRequest;
import com.kirana.inventory.dto.SupplierResponse;
import com.kirana.inventory.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping("/suppliers")
    public List<SupplierResponse> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @PostMapping("/suppliers")
    public ResponseEntity<SupplierResponse> createSupplier(@Valid @RequestBody SupplierRequest supplier) {
        SupplierResponse savedSupplier = supplierService.createSupplier(supplier);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSupplier);
    }

    @PostMapping("/suppliers/import")
    public ResponseEntity<BulkImportResponse> importSuppliers(@RequestParam("file") MultipartFile file) {
        try {
            int importedCount = supplierService.importSuppliers(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(new BulkImportResponse(importedCount));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
    }
}
