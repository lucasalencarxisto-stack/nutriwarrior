package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.*;
import com.lucas.nutriwarrior.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/auth/register/nutricionista")
    public ResponseEntity<UsuarioResponse> registrar(
            @Valid @RequestBody RegistroNutricionistaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.registrarNutricionista(request));
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal Jwt jwt) {
        return service.me(jwt.getSubject());
    }
}