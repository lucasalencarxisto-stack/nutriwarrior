package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.MealPlanDraftRequest;
import com.lucas.nutriwarrior.service.MealPlanDraftService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clientes/{clienteId}/plano-rascunho")
public class MealPlanDraftController {

    private final MealPlanDraftService service;

    public MealPlanDraftController(MealPlanDraftService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<MealPlanDraftService.DraftView> buscar(
            @PathVariable("clienteId") Long clienteId) {

        var draft = service.buscar(clienteId);

        if (draft == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(draft);
    }

    @PutMapping
    public MealPlanDraftService.DraftView salvar(
            @PathVariable("clienteId") Long clienteId,
            @Valid @RequestBody MealPlanDraftRequest request) {

        return service.salvar(clienteId, request);
    }
}