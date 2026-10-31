package com.kirana.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "festival_configs")
public class FestivalConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "festival_name", nullable = false)
    private String festivalName;

    @Column(name = "days_before_alert")
    private Integer daysBeforeAlert;

    @Column(name = "recommended_categories", nullable = false)
    private String recommendedCategories;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFestivalName() {
        return festivalName;
    }

    public void setFestivalName(String festivalName) {
        this.festivalName = festivalName;
    }

    public Integer getDaysBeforeAlert() {
        return daysBeforeAlert;
    }

    public void setDaysBeforeAlert(Integer daysBeforeAlert) {
        this.daysBeforeAlert = daysBeforeAlert;
    }

    public String getRecommendedCategories() {
        return recommendedCategories;
    }

    public void setRecommendedCategories(String recommendedCategories) {
        this.recommendedCategories = recommendedCategories;
    }
}
