package com.kirana.inventory;

import com.kirana.inventory.model.User;
import com.kirana.inventory.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FestivalConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String token() {
        User user = new User();
        user.setUserId("admin-test");
        user.setPhoneNumber("9876543210");
        user.setRole("ROLE_ADMIN");
        return jwtTokenProvider.generateToken(user);
    }

    @Test
    void shouldReturnFestivalConfigs() throws Exception {
        mockMvc.perform(get("/api/festivals")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].festivalName").exists());
    }
}
