package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.PlanTemplateRequest;
import com.lucas.nutriwarrior.service.PlanTemplateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/nutricionistas/me/plan-templates")
public class PlanTemplateController {

    private final PlanTemplateService service;

    public PlanTemplateController(PlanTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlanTemplateService.TemplateView> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanTemplateService.TemplateView create(
            @Valid @RequestBody PlanTemplateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PlanTemplateService.TemplateView update(
            @PathVariable Long id,
            @Valid @RequestBody PlanTemplateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
