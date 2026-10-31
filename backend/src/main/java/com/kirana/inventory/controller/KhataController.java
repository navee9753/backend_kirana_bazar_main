package com.kirana.inventory.controller;

import com.kirana.inventory.model.Khata;
import com.kirana.inventory.service.KhataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class KhataController {

    private final KhataService khataService;

    public KhataController(KhataService khataService) {
        this.khataService = khataService;
    }

    @GetMapping("/khata")
    public List<Khata> getAllKhataEntries() {
        return khataService.getAllEntries();
    }

    @PostMapping("/khata")
    public ResponseEntity<Khata> createKhataEntry(@Valid @RequestBody Khata khata) {
        Khata savedKhata = khataService.createKhataEntry(khata);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedKhata);
    }
}
