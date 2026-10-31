package com.kirana.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kirana.inventory.dto.LoginRequest;
import com.kirana.inventory.model.User;
import com.kirana.inventory.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldStorePasswordHashAsBcrypt() {
        Optional<User> user = userRepository.findByPhoneNumber("9876543210");

        assert user.isPresent();
        String passwordHash = user.get().getPasswordHash();

        org.junit.jupiter.api.Assertions.assertTrue(
                passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$"),
                "Expected a BCrypt hash, but got: " + passwordHash
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                BCrypt.checkpw("admin123", passwordHash),
                "Expected the stored hash to validate admin123"
        );
    }

    @Test
    void shouldAllowAdminLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setPhoneNumber("9876543210");
        request.setPassword("admin123");

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void shouldReturnJwtTokenOnSuccessfulLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setPhoneNumber("9876543210");
        request.setPassword("admin123");

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void shouldRejectInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setPhoneNumber("9876543210");
        request.setPassword("wrong-password");

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
