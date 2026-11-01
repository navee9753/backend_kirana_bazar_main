package com.kirana.inventory.service;

import com.kirana.inventory.model.Khata;
import com.kirana.inventory.repository.KhataRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class KhataService {

    private final KhataRepository khataRepository;

    public KhataService(KhataRepository khataRepository) {
        this.khataRepository = khataRepository;
    }

    public List<Khata> getAllEntries() {
        return khataRepository.findAll();
    }

    public Khata createKhataEntry(Khata khata) {
        if (khata == null || khata.getCustomerName() == null || khata.getCustomerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }

        khata.setCustomerName(khata.getCustomerName().trim());
        return khataRepository.save(khata);
    }

    public Khata updateKhataEntry(Long id, Khata khata) {
        Khata existing = khataRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khata entry not found"));

        if (khata == null || khata.getCustomerName() == null || khata.getCustomerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }

        existing.setCustomerName(khata.getCustomerName().trim());
        existing.setPhoneNumber(khata.getPhoneNumber());
        existing.setOutstandingBalance(khata.getOutstandingBalance());
        return khataRepository.save(existing);
    }

    public void deleteKhataEntry(Long id) {
        Khata existing = khataRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khata entry not found"));
        khataRepository.delete(existing);
    }
}
