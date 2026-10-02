package com.lucas.nutriwarrior.controller;
import com.lucas.nutriwarrior.service.CareService;
import com.lucas.nutriwarrior.model.dto.CareRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class CareController {
    private final CareService service;
    public CareController(CareService service) { this.service = service; }
    @GetMapping("/clientes/{id}/care") public List<CareService.View> history(@PathVariable Long id) { return service.history(id); }
    @PostMapping("/clientes/{id}/care") @ResponseStatus(HttpStatus.CREATED)
    public CareService.View save(@PathVariable Long id, @Valid @RequestBody CareRequest request) { return service.save(id, request); }
    @GetMapping("/clientes/{id}/plano-vigente") public CareService.View plan(@PathVariable Long id) { return service.currentPlan(id); }
    @GetMapping("/nutricionistas/me/retornos") public List<CareService.FollowUp> followUps() { return service.followUps(); }
}
