package com.kirana.inventory.dto;

public class LoginResponse {
    private String userId;
    private String phoneNumber;
    private String role;
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(String userId, String phoneNumber, String role, String token) {
        this.userId = userId;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.token = token;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
