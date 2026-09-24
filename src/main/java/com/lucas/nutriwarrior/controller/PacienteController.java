package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.NovoPacienteRequest;
import com.lucas.nutriwarrior.model.dto.UsuarioResponse;
import com.lucas.nutriwarrior.service.PacienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}