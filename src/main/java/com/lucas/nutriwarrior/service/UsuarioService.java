package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService implements UserDetailsService {
    private final UsuarioRepository repository;

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        Usuario usuario = repository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Credenciais invalidas"));
        return User.withUsername(usuario.email)
            .password(usuario.senhaHash)
            .roles(usuario.role.name())
            .disabled(!usuario.ativo)
            .build();
    }
}