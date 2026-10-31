package com.kirana.inventory.service;

import com.kirana.inventory.model.FestivalConfig;
import com.kirana.inventory.repository.FestivalConfigRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FestivalConfigService {

    private final FestivalConfigRepository festivalConfigRepository;

    public FestivalConfigService(FestivalConfigRepository festivalConfigRepository) {
        this.festivalConfigRepository = festivalConfigRepository;
    }

    public List<FestivalConfig> getFestivalConfigs() {
        return festivalConfigRepository.findAllByOrderByDaysBeforeAlertAsc();
    }
}
