package com.kirana.inventory.repository;

import com.kirana.inventory.model.FestivalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FestivalConfigRepository extends JpaRepository<FestivalConfig, Long> {
    List<FestivalConfig> findAllByOrderByDaysBeforeAlertAsc();
}
