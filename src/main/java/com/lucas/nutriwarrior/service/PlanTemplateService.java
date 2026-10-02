package com.lucas.nutriwarrior.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.model.dto.CareRequest;
import com.lucas.nutriwarrior.model.dto.PlanTemplateRequest;
import com.lucas.nutriwarrior.model.entity.PlanTemplate;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.repository.PlanTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class PlanTemplateService {

    private final PlanTemplateRepository repository;
    private final ClienteAccessService access;
    private final ObjectMapper mapper;

    public PlanTemplateService(
            PlanTemplateRepository repository,
            ClienteAccessService access,
            ObjectMapper mapper) {
        this.repository = repository;
        this.access = access;
        this.mapper = mapper;
    }

    public record TemplatePayload(
        List<CareRequest.Meal> meals
    ) {}

    public record TemplateView(
        Long id,
        String name,
        String title,
        String notes,
        List<CareRequest.Meal> meals,
        Instant createdAt,
        Instant updatedAt
    ) {}

    @Transactional(readOnly = true)
    public List<TemplateView> list() {
        var author = access.exigirRole(Role.NUTRICIONISTA);
        return repository
            .findAllByAuthor_IdOrderByUpdatedAtDesc(author.id)
            .stream()
            .map(this::view)
            .toList();
    }

    @Transactional
    public TemplateView create(PlanTemplateRequest request) {
        var author = access.exigirRole(Role.NUTRICIONISTA);

        var template = new PlanTemplate();
        template.author = author;
        apply(template, request);

        return view(repository.saveAndFlush(template));
    }

    @Transactional
    public TemplateView update(Long id, PlanTemplateRequest request) {
        var author = access.exigirRole(Role.NUTRICIONISTA);
        var template = repository.findByIdAndAuthor_Id(id, author.id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Modelo de plano nao encontrado"
            ));

        apply(template, request);
        return view(repository.saveAndFlush(template));
    }

    @Transactional
    public void delete(Long id) {
        var author = access.exigirRole(Role.NUTRICIONISTA);
        var template = repository.findByIdAndAuthor_Id(id, author.id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Modelo de plano nao encontrado"
            ));
        repository.delete(template);
    }

    private void apply(PlanTemplate template, PlanTemplateRequest request) {
        template.name = request.name().trim();
        template.title = request.title().trim();
        template.notes = request.notes().trim();

        try {
            template.payload = mapper.writeValueAsString(
                new TemplatePayload(request.meals())
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                "Nao foi possivel salvar o modelo de plano",
                exception
            );
        }
    }

    private TemplateView view(PlanTemplate template) {
        try {
            var payload = mapper.readValue(
                template.payload,
                TemplatePayload.class
            );

            return new TemplateView(
                template.id,
                template.name,
                template.title,
                template.notes,
                payload.meals(),
                template.createdAt,
                template.updatedAt
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                "Modelo de plano invalido",
                exception
            );
        }
    }
}
