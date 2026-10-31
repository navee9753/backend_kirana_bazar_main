package com.kirana.inventory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "khata_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Khata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Customer name is required")
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "outstanding_balance")
    private BigDecimal outstandingBalance;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    private void updateTimestamp() {
        this.lastUpdated = LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final Khata khata = new Khata();

        public Builder id(Long id) {
            khata.setId(id);
            return this;
        }

        public Builder customerName(String customerName) {
            khata.setCustomerName(customerName);
            return this;
        }

        public Builder phoneNumber(String phoneNumber) {
            khata.setPhoneNumber(phoneNumber);
            return this;
        }

        public Builder outstandingBalance(BigDecimal outstandingBalance) {
            khata.setOutstandingBalance(outstandingBalance);
            return this;
        }

        public Builder lastUpdated(LocalDateTime lastUpdated) {
            khata.setLastUpdated(lastUpdated);
            return this;
        }

        public Khata build() {
            return khata;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
