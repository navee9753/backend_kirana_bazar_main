# Project rules (Kirana inventory + khata SaaS)

Stack: Java 17 (target 21), Spring Boot 3.3.x, Spring Security 6, Spring Data JPA,
PostgreSQL 16, Liquibase (YAML/XML changelogs in backend/src/main/resources/db/changelog),
Testcontainers, Angular 17+ standalone components.
Root package: com.kirana.inventory. Package by feature, not by layer:
identity, catalog, inventory, purchasing, sales, khata, insights, notification, shared.

Rules:
- Never commit secrets. Read secrets from environment variables. No default password or JWT key in code.
- Passwords: BCrypt only. Never compare plain text.
- Money: BigDecimal and NUMERIC(14,2). Quantities: BigDecimal and NUMERIC(12,3). Never float/double.
- Do not expose JPA entities from controllers. Use request and response DTOs (records).
- Every business table has shop_id. Every query is scoped by the current shop (TenantContext).
- Stock and khata are append-only ledgers. Corrections are new rows, never updates or deletes.
- Authorise by permission (e.g. COST_PRICE_VIEW), not by role name.
- Database changes only through Liquibase changesets. ddl-auto must stay "validate" or "none".
- Controllers are thin; business logic lives in services; services are @Transactional where they write.
- Validation with jakarta.validation on DTOs. Errors via one @RestControllerAdvice returning RFC 7807 ProblemDetail.
- Tests: JUnit 5 + Testcontainers (Postgres). No tests that need a local database.
- Do not edit files outside the scope of the current task. List the files you changed at the end.
- If a requirement is unclear, ask instead of guessing.
