package com.kirana.inventory.service;

import com.kirana.inventory.dto.SupplierRequest;
import com.kirana.inventory.dto.SupplierResponse;
import com.kirana.inventory.model.Supplier;
import com.kirana.inventory.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAllByOrderByIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.name().trim());
        supplier.setContactPerson(trimToNull(request.contactPerson()));
        supplier.setPhoneNumber(request.phoneNumber().trim());
        supplier.setEmail(trimToNull(request.email()));
        supplier.setCompanyBrand(trimToNull(request.companyBrand()));
        supplier.setPendingPayable(request.pendingPayable() == null ? BigDecimal.ZERO : request.pendingPayable());
        supplier.setLastDeliveryDate(request.lastDeliveryDate());
        return toResponse(supplierRepository.save(supplier));
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getContactPerson(),
                supplier.getPhoneNumber(),
                supplier.getEmail(),
                supplier.getCompanyBrand(),
                supplier.getPendingPayable() == null ? BigDecimal.ZERO : supplier.getPendingPayable(),
                supplier.getLastDeliveryDate()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
