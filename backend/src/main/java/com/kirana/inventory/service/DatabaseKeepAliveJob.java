package com.kirana.inventory.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DatabaseKeepAliveJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseKeepAliveJob.class);
    private static final long FIFTEEN_MINUTES_MS = 14 * 60 * 1000L;

    private final JdbcTemplate jdbcTemplate;

    public DatabaseKeepAliveJob(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(fixedRate = FIFTEEN_MINUTES_MS)
    public void keepDatabaseAlive() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        if (!Integer.valueOf(1).equals(result)) {
            throw new IllegalStateException("Database keep-alive query returned an unexpected result.");
        }
        LOGGER.debug("Database keep-alive query completed.");
    }
}
