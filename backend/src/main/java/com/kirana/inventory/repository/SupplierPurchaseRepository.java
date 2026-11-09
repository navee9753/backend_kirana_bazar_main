package com.kirana.inventory.repository;

import com.kirana.inventory.model.SupplierPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierPurchaseRepository extends JpaRepository<SupplierPurchase, Long> {

    List<SupplierPurchase> findBySupplierId(Long supplierId);
}
