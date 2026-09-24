package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.MetaNutricionalRequest;
import com.lucas.nutriwarrior.model.dto.MetaNutricionalResponse;
import com.lucas.nutriwarrior.service.MetaNutricionalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clientes/{clienteId}/metas")
public class MetaNutricionalController {
    private final MetaNutricionalService service;

    public MetaNutricionalController(MetaNutricionalService service) {
        this.service = service;
    }

    @GetMapping
    public MetaNutricionalResponse buscar(@PathVariable Long clienteId) {
        return service.buscar(clienteId);
    }

    @PutMapping
    public MetaNutricionalResponse salvar(@PathVariable Long clienteId,
            @Valid @RequestBody MetaNutricionalRequest request) {
        return service.salvar(clienteId, request);
    }
}