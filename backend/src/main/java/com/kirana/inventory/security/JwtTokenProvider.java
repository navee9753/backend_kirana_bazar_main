package com.kirana.inventory.security;

import com.kirana.inventory.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000L;
    private static final String SECRET_KEY = "kirana-inventory-local-secret-key-32-bytes-long!";

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        String role = normalizeRole(user.getRole());
        return Jwts.builder()
                .setSubject(user.getPhoneNumber())
                .claim("userId", user.getUserId())
                .claim("role", role)
                .claim("authorities", List.of("ROLE_" + role))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String normalizeRole(String rawRole) {
        if (rawRole == null) {
            return "WORKER";
        }
        String trimmed = rawRole.trim();
        return trimmed.startsWith("ROLE_") ? trimmed.replace("ROLE_", "") : trimmed;
    }
}
