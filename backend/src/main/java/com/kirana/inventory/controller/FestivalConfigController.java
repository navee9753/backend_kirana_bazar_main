package com.kirana.inventory.controller;

import com.kirana.inventory.model.FestivalConfig;
import com.kirana.inventory.service.FestivalConfigService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class FestivalConfigController {

    private final FestivalConfigService festivalConfigService;

    public FestivalConfigController(FestivalConfigService festivalConfigService) {
        this.festivalConfigService = festivalConfigService;
    }

    @GetMapping("/festivals")
    public List<FestivalConfig> getFestivalConfigs() {
        return festivalConfigService.getFestivalConfigs();
    }
}
