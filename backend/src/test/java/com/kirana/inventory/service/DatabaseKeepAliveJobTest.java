package com.kirana.inventory.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DatabaseKeepAliveJobTest {

    @Test
    void executesDatabaseConnectivityQuery() {
        AtomicReference<String> executedQuery = new AtomicReference<>();
        JdbcTemplate jdbcTemplate = jdbcTemplateReturning(1, executedQuery);
        DatabaseKeepAliveJob job = new DatabaseKeepAliveJob(jdbcTemplate);

        job.keepDatabaseAlive();

        assertEquals("SELECT 1", executedQuery.get());
    }

    @Test
    void failsIfDatabaseQueryReturnsUnexpectedResult() {
        JdbcTemplate jdbcTemplate = jdbcTemplateReturning(0, new AtomicReference<>());
        DatabaseKeepAliveJob job = new DatabaseKeepAliveJob(jdbcTemplate);

        assertThrows(IllegalStateException.class, job::keepDatabaseAlive);
    }

    private JdbcTemplate jdbcTemplateReturning(int result, AtomicReference<String> executedQuery) {
        return new JdbcTemplate() {
            @Override
            public <T> T queryForObject(String sql, Class<T> requiredType) {
                executedQuery.set(sql);
                return requiredType.cast(result);
            }
        };
    }
}
