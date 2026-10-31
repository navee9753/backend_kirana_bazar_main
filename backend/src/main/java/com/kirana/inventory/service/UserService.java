package com.kirana.inventory.service;

import com.kirana.inventory.dto.LoginRequest;
import com.kirana.inventory.dto.LoginResponse;
import com.kirana.inventory.model.User;
import com.kirana.inventory.repository.UserRepository;
import com.kirana.inventory.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, JwtTokenProvider jwtTokenProvider, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse authenticate(LoginRequest request) {
        if (request == null || request.getPhoneNumber() == null || request.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String phoneNumber = request.getPhoneNumber().trim();
        String password = request.getPassword().trim();

        Optional<User> userOptional = userRepository.findByPhoneNumber(phoneNumber);
        if (userOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User user = userOptional.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String role = normalizeRole(user.getRole());
        String token = jwtTokenProvider.generateToken(user);
        return new LoginResponse(user.getUserId(), user.getPhoneNumber(), role, token);
    }

    private String normalizeRole(String rawRole) {
        if (rawRole == null) {
            return "WORKER";
        }

        String trimmed = rawRole.trim();
        if (trimmed.startsWith("ROLE_")) {
            return trimmed.replace("ROLE_", "");
        }
        return trimmed;
    }
}
