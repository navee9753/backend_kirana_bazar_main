package com.kirana.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kirana.inventory.model.Khata;
import com.kirana.inventory.model.User;
import com.kirana.inventory.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class KhataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken() {
        User user = new User();
        user.setUserId("admin-test");
        user.setPhoneNumber("9876543210");
        user.setRole("ROLE_ADMIN");
        return jwtTokenProvider.generateToken(user);
    }

    @Test
    void shouldCreateKhataWhenCustomerNameIsPresent() throws Exception {
        Khata khata = new Khata();
        khata.setCustomerName("Ravi Kumar");
        khata.setPhoneNumber("9876543210");
        khata.setOutstandingBalance(new BigDecimal("250.50"));

        mockMvc.perform(post("/api/khata")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(khata)))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldRejectKhataWithoutCustomerName() throws Exception {
        Khata khata = new Khata();
        khata.setCustomerName("  ");
        khata.setPhoneNumber("9876543210");
        khata.setOutstandingBalance(new BigDecimal("250.50"));

        mockMvc.perform(post("/api/khata")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(khata)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldUpdateKhataWhenIdExists() throws Exception {
        Khata khata = new Khata();
        khata.setCustomerName("Ravi Kumar Update");
        khata.setPhoneNumber("9876543210");
        khata.setOutstandingBalance(new BigDecimal("400.00"));

        MockHttpServletResponse createResponse = mockMvc.perform(post("/api/khata")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(khata)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse();

        Khata created = objectMapper.readValue(createResponse.getContentAsString(), Khata.class);

        mockMvc.perform(put("/api/khata/{id}", created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(khata)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldDeleteKhataWhenIdExists() throws Exception {
        Khata khata = new Khata();
        khata.setCustomerName("Ravi Kumar Delete");
        khata.setPhoneNumber("9876543210");
        khata.setOutstandingBalance(new BigDecimal("500.00"));

        MockHttpServletResponse createResponse = mockMvc.perform(post("/api/khata")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(khata)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse();

        Khata created = objectMapper.readValue(createResponse.getContentAsString(), Khata.class);

        mockMvc.perform(delete("/api/khata/{id}", created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken()))
                .andExpect(status().isNoContent());
    }
}
