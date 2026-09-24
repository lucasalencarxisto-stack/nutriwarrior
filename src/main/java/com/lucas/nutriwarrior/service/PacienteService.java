package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.NovoPacienteRequest;
import com.lucas.nutriwarrior.model.dto.UsuarioResponse;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import com.lucas.nutriwarrior.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class PacienteService {
    private final ClienteAccessService accessService;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public PacienteService(ClienteAccessService accessService,
            UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder) {
        this.accessService = accessService;
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResponse criar(NovoPacienteRequest request) {
        Usuario nutricionista = accessService.exigirRole(Role.NUTRICIONISTA);
        String email = AuthService.normalizarEmail(request.email);
        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ja cadastrado");
        }
        Usuario paciente = new Usuario();
        paciente.nome = request.nome.trim();
        paciente.email = email;
        paciente.senhaHash = passwordEncoder.encode(request.senha);
        paciente.role = Role.PACIENTE;
        paciente.ativo = true;
        paciente.createdAt = Instant.now();
        usuarioRepository.save(paciente);

        Cliente cliente = new Cliente();
        cliente.nome = request.nome.trim();
        cliente.pesoAtualKg = request.pesoAtualKg;
        cliente.usuario = paciente;
        cliente.nutricionista = nutricionista;
        clienteRepository.save(cliente);
        return UsuarioResponse.fromEntity(paciente, cliente.id);
    }

    public List<UsuarioResponse> listar() {
        Usuario nutricionista = accessService.exigirRole(Role.NUTRICIONISTA);
        return clienteRepository.findAllByNutricionista_IdOrderByIdAsc(nutricionista.id)
            .stream().map(cliente -> UsuarioResponse.fromEntity(cliente.usuario, cliente.id)).toList();
    }
}