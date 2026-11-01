package com.kirana.inventory.service;

import com.kirana.inventory.model.Supplier;
import com.kirana.inventory.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAllByOrderByIdDesc();
    }

    public Supplier createSupplier(Supplier supplier) {
        if (supplier == null) {
            throw new IllegalArgumentException("Supplier is required");
        }

        if (supplier.getSupplierName() == null || supplier.getSupplierName().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name is required");
        }

        if (supplier.getFirmName() == null || supplier.getFirmName().trim().isEmpty()) {
            throw new IllegalArgumentException("Firm name is required");
        }

        if (supplier.getAddress() == null || supplier.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Address is required");
        }

        supplier.setSupplierName(supplier.getSupplierName().trim());
        supplier.setFirmName(supplier.getFirmName().trim());
        supplier.setAddress(supplier.getAddress().trim());

        if (supplier.getDetails() != null) {
            supplier.setDetails(supplier.getDetails().trim());
        }

        if (supplier.getPhoneNumber() != null) {
            supplier.setPhoneNumber(supplier.getPhoneNumber().trim());
        }

        if (supplier.getEmail() != null) {
            supplier.setEmail(supplier.getEmail().trim());
        }

        return supplierRepository.save(supplier);
    }
}
