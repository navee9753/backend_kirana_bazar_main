package com.kirana.inventory.repository;

import com.kirana.inventory.model.Supplier;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findAllByOrderByIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Supplier s WHERE s.id = :id")
    Optional<Supplier> findByIdForUpdate(@Param("id") Long id);
}
