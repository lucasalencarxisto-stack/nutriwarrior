package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.AtualizarPacienteRequest;
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
        paciente.telefone = normalizarTelefone(request.telefone);
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

    @Transactional
    public UsuarioResponse atualizar(
            Long clienteId,
            AtualizarPacienteRequest request) {

        accessService.exigirRole(
                Role.NUTRICIONISTA);

        Cliente cliente = accessService.exigirAcesso(
                clienteId);

        Usuario paciente = cliente.usuario;

        if (paciente == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Usuario do paciente nao encontrado");
        }

        if (request.nome != null) {

            String nome = request.nome.trim();

            if (nome.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Nome nao pode ser vazio");
            }

            paciente.nome = nome;
            cliente.nome = nome;
        }

        if (request.email != null) {

            String email = AuthService.normalizarEmail(
                    request.email);

            if (email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email nao pode ser vazio");
            }

            boolean emailEmUso = usuarioRepository
                    .findByEmail(email)
                    .filter(usuario -> !usuario.id.equals(
                            paciente.id))
                    .isPresent();

            if (emailEmUso) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email ja cadastrado");
            }

            paciente.email = email;
        }

        if (request.telefone != null) {
            paciente.telefone = normalizarTelefone(
                    request.telefone);
        }

        if (request.senha != null &&
                !request.senha.isBlank()) {
            paciente.senhaHash = passwordEncoder.encode(
                    request.senha);
        }

        usuarioRepository.save(
                paciente);

        clienteRepository.save(
                cliente);

        return UsuarioResponse.fromEntity(
                paciente,
                cliente.id);
    }

    @Transactional
    public void deletar(Long clienteId) {

        accessService.exigirRole(
                Role.NUTRICIONISTA);

        Cliente cliente = accessService.exigirAcesso(
                clienteId);

        Usuario paciente = cliente.usuario;

        clienteRepository.delete(
                cliente);

        /*
         * Força a remoção do Cliente primeiro.
         * Isso evita conflito com a FK
         * usuario_id antes de deletarmos
         * o Usuario do paciente.
         */
        clienteRepository.flush();

        if (paciente != null) {
            usuarioRepository.delete(
                    paciente);
        }
    }

    private String normalizarTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) {
            return null;
        }

        String digits = telefone.replaceAll("\\D", "");

        if (digits.startsWith("00")) {
            digits = digits.substring(2);
        }

        if (digits.length() == 10 || digits.length() == 11) {
            digits = "55" + digits;
        }

        if (!digits.startsWith("55") ||
                (digits.length() != 12 && digits.length() != 13)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Telefone invalido");
        }

        return "+" + digits;
    }
}
