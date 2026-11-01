package com.kirana.inventory.controller;

import com.kirana.inventory.model.Supplier;
import com.kirana.inventory.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @PostMapping("/suppliers")
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody Supplier supplier) {
        Supplier savedSupplier = supplierService.createSupplier(supplier);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSupplier);
    }
}
