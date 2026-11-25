package com.kirana.inventory.repository;

import com.kirana.inventory.model.KhataCustomer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KhataCustomerRepository extends JpaRepository<KhataCustomer, Long> {

    List<KhataCustomer> findAllByOrderByOutstandingBalanceDesc();

    boolean existsByPhoneNumber(String phoneNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT customer FROM KhataCustomer customer WHERE customer.id = :id")
    Optional<KhataCustomer> findByIdForUpdate(@Param("id") Long id);
}
