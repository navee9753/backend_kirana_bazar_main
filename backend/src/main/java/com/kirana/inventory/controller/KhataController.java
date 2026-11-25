package com.kirana.inventory.controller;

import com.kirana.inventory.dto.KhataCheckoutCreditRequest;
import com.kirana.inventory.dto.KhataCustomerRequest;
import com.kirana.inventory.dto.KhataCustomerResponse;
import com.kirana.inventory.dto.KhataTransactionRequest;
import com.kirana.inventory.dto.KhataTransactionResponse;
import com.kirana.inventory.model.Khata;
import com.kirana.inventory.service.KhataLedgerService;
import com.kirana.inventory.service.KhataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:4200", "https://backend-kirana-bazar-main.vercel.app"})
public class KhataController {

    private final KhataService khataService;
    private final KhataLedgerService khataLedgerService;

    public KhataController(KhataService khataService, KhataLedgerService khataLedgerService) {
        this.khataService = khataService;
        this.khataLedgerService = khataLedgerService;
    }

    @GetMapping("/khata/customers")
    public List<KhataCustomerResponse> getCustomers() {
        return khataLedgerService.getCustomers();
    }

    @PostMapping("/khata/customers")
    public ResponseEntity<KhataCustomerResponse> createCustomer(
            @Valid @RequestBody KhataCustomerRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(khataLedgerService.createCustomer(request));
    }

    @GetMapping("/khata/customers/{id}/transactions")
    public List<KhataTransactionResponse> getCustomerTransactions(@PathVariable Long id) {
        return khataLedgerService.getTransactions(id);
    }

    @PostMapping("/khata/customers/{id}/transactions")
    public KhataCustomerResponse createCustomerTransaction(
            @PathVariable Long id,
            @Valid @RequestBody KhataTransactionRequest request
    ) {
        return khataLedgerService.recordTransaction(id, request);
    }

    @PostMapping("/khata/checkout-credit")
    public KhataCustomerResponse checkoutCredit(@Valid @RequestBody KhataCheckoutCreditRequest request) {
        return khataLedgerService.checkoutOnCredit(request);
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

    @PutMapping("/khata/{id}")
    public ResponseEntity<Khata> updateKhataEntry(@PathVariable Long id, @Valid @RequestBody Khata khata) {
        Khata updatedKhata = khataService.updateKhataEntry(id, khata);
        return ResponseEntity.ok(updatedKhata);
    }

    @DeleteMapping("/khata/{id}")
    public ResponseEntity<Void> deleteKhataEntry(@PathVariable Long id) {
        khataService.deleteKhataEntry(id);
        return ResponseEntity.noContent().build();
    }
}
