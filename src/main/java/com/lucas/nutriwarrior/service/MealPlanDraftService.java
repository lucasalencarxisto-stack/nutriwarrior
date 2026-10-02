package com.lucas.nutriwarrior.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.model.dto.MealPlanDraftRequest;
import com.lucas.nutriwarrior.model.entity.MealPlanDraft;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.repository.MealPlanDraftRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class MealPlanDraftService {

    private final MealPlanDraftRepository repository;
    private final ClienteAccessService access;
    private final EntityManager entityManager;
    private final ObjectMapper mapper;

    public MealPlanDraftService(
            MealPlanDraftRepository repository,
            ClienteAccessService access,
            EntityManager entityManager,
            ObjectMapper mapper) {
        this.repository = repository;
        this.access = access;
        this.entityManager = entityManager;
        this.mapper = mapper;
    }

    public record DraftView(
            Long id,
            Long clienteId,
            String title,
            LocalDate planDate,
            String notes,
            List<MealPlanDraftRequest.Meal> meals,
            Long version,
            Instant updatedAt) {}

    public record DraftPayload(
            List<MealPlanDraftRequest.Meal> meals) {}

    @Transactional(readOnly = true)
    public DraftView buscar(Long clienteId) {
        access.exigirRole(Role.NUTRICIONISTA);
        access.exigirAcesso(clienteId);

        return repository.findByCliente_Id(clienteId)
                .map(this::toView)
                .orElse(null);
    }

    @Transactional
    public DraftView salvar(
            Long clienteId,
            MealPlanDraftRequest request) {

        var author = access.exigirRole(Role.NUTRICIONISTA);
        var cliente = access.exigirAcesso(clienteId);

        // Serializa as gravações deste paciente, inclusive a primeira.
        entityManager.lock(cliente, LockModeType.PESSIMISTIC_WRITE);

        var existing = repository.findByCliente_Id(clienteId);
        MealPlanDraft draft;

        if (existing.isPresent()) {
            draft = existing.get();

            if (!Objects.equals(request.version(), draft.version)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "O rascunho foi alterado. Recarregue antes de salvar."
                );
            }
        } else {
            if (request.version() != null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "O rascunho informado não existe mais. Recarregue a página."
                );
            }

            draft = new MealPlanDraft();
            draft.cliente = cliente;
        }

        draft.author = author;
        draft.title = request.title();
        draft.planDate = request.planDate();
        draft.notes = request.notes();
        draft.payload = serializeMeals(request.meals());

        return toView(repository.saveAndFlush(draft));
    }

    private String serializeMeals(
            List<MealPlanDraftRequest.Meal> meals) {
        try {
            return mapper.writeValueAsString(new DraftPayload(meals));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Não foi possível serializar o rascunho.",
                    exception
            );
        }
    }

    private DraftView toView(MealPlanDraft draft) {
        try {
            DraftPayload payload = mapper.readValue(
                    draft.payload,
                    DraftPayload.class
            );

            return new DraftView(
                    draft.id,
                    draft.cliente.id,
                    draft.title,
                    draft.planDate,
                    draft.notes,
                    payload.meals(),
                    draft.version,
                    draft.updatedAt
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Não foi possível ler o rascunho salvo.",
                    exception
            );
        }
    }
}