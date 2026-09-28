package com.lucas.nutriwarrior.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lucas.nutriwarrior.model.dto.NovoPacienteRequest;
import com.lucas.nutriwarrior.model.dto.UsuarioResponse;
import com.lucas.nutriwarrior.service.PacienteService;
import com.lucas.nutriwarrior.model.dto.AtualizarPacienteRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/nutricionistas/me/pacientes")
public class PacienteController {
    private final PacienteService service;

    public PacienteController(PacienteService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(@Valid @RequestBody NovoPacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return service.listar();
    }

    @PatchMapping("/{clienteId}")
    public UsuarioResponse atualizar(
            @PathVariable Long clienteId,
            @Valid @RequestBody AtualizarPacienteRequest request) {

        return service.atualizar(
                clienteId,
                request);
    }

    @DeleteMapping("/{clienteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(
            @PathVariable Long clienteId) {
        service.deletar(clienteId);
    }
}