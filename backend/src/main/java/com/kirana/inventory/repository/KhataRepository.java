package com.kirana.inventory.repository;

import com.kirana.inventory.model.Khata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface KhataRepository extends JpaRepository<Khata, Long> {

    @Query("SELECT COALESCE(SUM(k.outstandingBalance), 0) FROM Khata k")
    BigDecimal getTotalOutstandingBalance();
}
