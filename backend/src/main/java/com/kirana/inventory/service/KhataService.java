package com.kirana.inventory.service;

import com.kirana.inventory.model.Khata;
import com.kirana.inventory.repository.KhataRepository;
import org.springframework.stereotype.Service;

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
}
