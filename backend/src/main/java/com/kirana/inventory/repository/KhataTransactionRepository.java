package com.kirana.inventory.repository;

import com.kirana.inventory.model.KhataTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KhataTransactionRepository extends JpaRepository<KhataTransaction, Long> {

    List<KhataTransaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);
}
