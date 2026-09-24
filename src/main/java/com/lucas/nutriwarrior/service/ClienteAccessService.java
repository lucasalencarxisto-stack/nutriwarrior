package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClienteAccessService {
    private final AuthService authService;
    private final ClienteRepository clienteRepository;

    public ClienteAccessService(AuthService authService, ClienteRepository clienteRepository) {
        this.authService = authService;
        this.clienteRepository = clienteRepository;
    }

    public Usuario usuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new AccessDeniedException("Usuario autenticado invalido");
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return authService.buscar(jwt.getSubject());
        }
        return authService.buscarPorEmail(authentication.getName());
    }

    public Usuario exigirRole(Role role) {
        Usuario usuario = usuarioAtual();
        if (usuario.role != role) {
            throw new AccessDeniedException("Permissao insuficiente");
        }
        return usuario;
    }

    public Cliente exigirAcesso(Long clienteId) {
        Usuario usuario = usuarioAtual();
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Cliente nao encontrado com id=" + clienteId));
        boolean allowed = usuario.role == Role.NUTRICIONISTA
            ? cliente.nutricionista != null && cliente.nutricionista.id.equals(usuario.id)
            : cliente.usuario != null && cliente.usuario.id.equals(usuario.id);
        if (!allowed) {
            throw new AccessDeniedException("Acesso negado ao cliente");
        }
        return cliente;
    }
}