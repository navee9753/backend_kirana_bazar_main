package com.kirana.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "contact_person", length = 150)
    private String contactPerson;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "company_brand", length = 150)
    private String companyBrand;

    @Column(name = "pending_payable", precision = 14, scale = 2)
    private BigDecimal pendingPayable;

    @Column(name = "last_delivery_date")
    private LocalDateTime lastDeliveryDate;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCompanyBrand() {
        return companyBrand;
    }

    public void setCompanyBrand(String companyBrand) {
        this.companyBrand = companyBrand;
    }

    public BigDecimal getPendingPayable() {
        return pendingPayable;
    }

    public void setPendingPayable(BigDecimal pendingPayable) {
        this.pendingPayable = pendingPayable;
    }

    public LocalDateTime getLastDeliveryDate() {
        return lastDeliveryDate;
    }

    public void setLastDeliveryDate(LocalDateTime lastDeliveryDate) {
        this.lastDeliveryDate = lastDeliveryDate;
    }
}
