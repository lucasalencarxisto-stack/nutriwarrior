package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.ResumoNutricionalResponse;
import com.lucas.nutriwarrior.service.ResumoNutricionalService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/clientes/{clienteId}/dias")
public class ResumoNutricionalController {
    private final ResumoNutricionalService service;

    public ResumoNutricionalController(ResumoNutricionalService service) {
        this.service = service;
    }

    @GetMapping("/{data}/resumo")
    public ResumoNutricionalResponse buscar(@PathVariable Long clienteId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {
        return service.buscar(clienteId, data);
    }
}