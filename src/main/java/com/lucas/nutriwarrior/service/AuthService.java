package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.config.JwtProperties;
import com.lucas.nutriwarrior.model.dto.*;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import com.lucas.nutriwarrior.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public AuthService(UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository, PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public UsuarioResponse registrarNutricionista(RegistroNutricionistaRequest request) {
        String email = normalizarEmail(request.email);
        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Email ja cadastrado");
        }
        Usuario usuario = novoUsuario(request.nome, email, request.senha, Role.NUTRICIONISTA);
        return UsuarioResponse.fromEntity(usuarioRepository.save(usuario), null);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizarEmail(request.email);
        Usuario usuario = usuarioRepository.findByEmail(email)
            .filter(candidate -> candidate.ativo && passwordEncoder.matches(
                request.senha, candidate.senhaHash))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Credenciais invalidas"));
        Instant now = Instant.now();
        long expiresIn = jwtProperties.getExpirationMinutes() * 60;
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .subject(usuario.id.toString())
            .claim("role", usuario.role.name())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiresIn))
            .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        AuthResponse response = new AuthResponse();
        response.accessToken = token;
        response.expiresIn = expiresIn;
        response.usuario = usuarioResponse(usuario);
        return response;
    }

    public UsuarioResponse me(String subject) {
        Usuario usuario = buscar(subject);
        return usuarioResponse(usuario);
    }

    public Usuario buscar(String subject) {
        try {
            return usuarioRepository.findById(Long.valueOf(subject))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Usuario invalido"));
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Usuario invalido");
        }
    }

    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(normalizarEmail(email))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Usuario invalido"));
    }

    public static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private Usuario novoUsuario(String nome, String email, String senha, Role role) {
        Usuario usuario = new Usuario();
        usuario.nome = nome.trim();
        usuario.email = email;
        usuario.senhaHash = passwordEncoder.encode(senha);
        usuario.role = role;
        usuario.ativo = true;
        usuario.createdAt = Instant.now();
        return usuario;
    }

    private UsuarioResponse usuarioResponse(Usuario usuario) {
        Long clienteId = clienteRepository.findByUsuario_Id(usuario.id)
            .map(cliente -> cliente.id).orElse(null);
        return UsuarioResponse.fromEntity(usuario, clienteId);
    }
}