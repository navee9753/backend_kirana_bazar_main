package com.kirana.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kirana.inventory.model.Product;
import com.kirana.inventory.model.User;
import com.kirana.inventory.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken() {
        User admin = new User();
        admin.setUserId("admin-test");
        admin.setPhoneNumber("9999999999");
        admin.setRole("ROLE_ADMIN");
        return jwtTokenProvider.generateToken(admin);
    }

    private String workerToken() {
        User worker = new User();
        worker.setUserId("worker-test");
        worker.setPhoneNumber("8888888888");
        worker.setRole("ROLE_WORKER");
        return jwtTokenProvider.generateToken(worker);
    }

    @Test
    void shouldCreateProductWhenRequiredFieldsArePresent() throws Exception {
        Product product = Product.builder()
                .name("Rice")
                .brand("Tata")
                .category("Groceries")
                .currentStock(25)
                .minStockAlert(10)
                .purchasePrice(new BigDecimal("40.00"))
                .mrp(new BigDecimal("55.00"))
                .build();

        mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(product)))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldRejectProductWithoutName() throws Exception {
        Product product = Product.builder()
                .name("   ")
                .brand("Tata")
                .category("Groceries")
                .currentStock(25)
                .minStockAlert(10)
                .purchasePrice(new BigDecimal("40.00"))
                .mrp(new BigDecimal("55.00"))
                .build();

        mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(product)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectProductCreationForWorkerRole() throws Exception {
        Product product = Product.builder()
                .name("Wheat")
                .brand("Aashirvaad")
                .category("Groceries")
                .currentStock(10)
                .minStockAlert(5)
                .purchasePrice(new BigDecimal("32.00"))
                .mrp(new BigDecimal("40.00"))
                .build();

        mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + workerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(product)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnLowStockProducts() throws Exception {
        mockMvc.perform(get("/api/products/low-stock")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnDashboardSummary() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isOk());
    }
}
