package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;

abstract class AuthenticatedIntegrationTest {
    protected static final String TEST_EMAIL = "test-nutri@example.com";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void ensureTestNutritionist() {
        if (usuarioRepository.findByEmail(TEST_EMAIL).isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.nome = "Nutricionista de teste";
            usuario.email = TEST_EMAIL;
            usuario.senhaHash = "unused-in-mock-auth";
            usuario.role = Role.NUTRICIONISTA;
            usuario.ativo = true;
            usuario.createdAt = Instant.now();
            usuarioRepository.save(usuario);
        }
    }
}