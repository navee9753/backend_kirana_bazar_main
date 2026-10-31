package com.kirana.inventory.repository;

import com.kirana.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.minStockAlert ORDER BY p.name ASC")
    List<Product> findLowStockProducts();
}
