package com.lucas.nutriwarrior.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.model.dto.CareRequest;
import com.lucas.nutriwarrior.model.entity.*;
import com.lucas.nutriwarrior.repository.CareEntryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@Service
public class CareService {
    private final CareEntryRepository repository;
    private final ClienteAccessService access;
    private final EntityManager em;
    private final ObjectMapper mapper;
    public CareService(CareEntryRepository repository, ClienteAccessService access, EntityManager em, ObjectMapper mapper) {
        this.repository = repository; this.access = access; this.em = em; this.mapper = mapper;
    }
    public record View(Long id, Long clienteId, String kind, LocalDate date, LocalDate returnDate,
        String title, String notes, String anamnesis, JsonNode payload, int version, String author, Instant createdAt) {}
    public record FollowUp(Long clienteId, String patient, LocalDate consultationDate, LocalDate returnDate) {}

    @Transactional(readOnly = true)
    public List<View> history(Long id) {
        access.exigirRole(Role.NUTRICIONISTA); access.exigirAcesso(id);
        return repository.findAllByCliente_IdOrderByIdDesc(id).stream().map(this::view).toList();
    }
    @Transactional(readOnly = true)
    public View currentPlan(Long id) {
        access.exigirAcesso(id);
        return repository.findFirstByCliente_IdAndKindOrderByIdDesc(id, "PLAN").map(this::view).orElse(null);
    }
    @Transactional(readOnly = true)
    public List<FollowUp> followUps() {
        var user = access.exigirRole(Role.NUTRICIONISTA);
        Map<Long, CareEntry> latest = new LinkedHashMap<>();
        repository.findAllByCliente_Nutricionista_IdAndKindOrderByIdDesc(user.id, "CONSULTATION")
            .forEach(entry -> latest.merge(entry.cliente.id, entry, (a, b) -> b.entryDate.isAfter(a.entryDate) ? b : a));
        return latest.values().stream().filter(entry -> entry.returnDate != null)
            .sorted(Comparator.comparing(entry -> entry.returnDate))
            .map(entry -> new FollowUp(entry.cliente.id, entry.cliente.nome, entry.entryDate, entry.returnDate)).toList();
    }
    @Transactional
    public View save(Long id, CareRequest request) {
        var author = access.exigirRole(Role.NUTRICIONISTA);
        var client = access.exigirAcesso(id);
        em.lock(client, LockModeType.PESSIMISTIC_WRITE);
        var prior = repository.findByCliente_IdAndRequestId(id, request.requestId().toString());
        if (prior.isPresent()) return view(prior.get());
        if (request.kind() != CareRequest.Kind.CONSULTATION && request.returnDate() != null) bad("Retorno pertence à consulta.");
        if (request.returnDate() != null && request.returnDate().isBefore(request.date())) bad("Retorno anterior à consulta.");
        if (request.kind() != CareRequest.Kind.CONSULTATION && !request.anamnesis().isBlank()) bad("Anamnese pertence à consulta.");
        if (request.kind() != CareRequest.Kind.CONSULTATION && request.checklist() != null && !request.checklist().isEmpty()) bad("Checklist pertence à consulta.");

        JsonNode payload;
        switch (request.kind()) {
            case CONSULTATION -> {
                if (request.energy() != null || request.meals() != null) bad("Dados incompatíveis com consulta.");
                if (request.notes().isBlank() && request.anamnesis().isBlank()) bad("Registre a anamnese ou as observações da consulta.");
                payload = mapper.valueToTree(Map.of(
                    "checklist",
                    request.checklist() == null ? List.of() : request.checklist()
                ));
            }
            case PLAN -> {
                if (request.energy() != null || request.meals() == null || request.meals().isEmpty()) bad("Informe ao menos uma refeição.");
                payload = mapper.valueToTree(Map.of("meals", request.meals()));
            }
            case ENERGY -> {
                if (request.energy() == null || request.meals() != null) bad("Informe os dados da avaliação energética.");
                var input = request.energy();
                double basal = calculate(input);
                var node = mapper.createObjectNode();
                node.set("input", mapper.valueToTree(input));
                node.put("restingKcal", basal);
                if (input.activityFactor() != null) node.put("totalKcal", basal * input.activityFactor());
                else node.putNull("totalKcal");
                payload = node;
            }
            default -> throw new IllegalArgumentException("Tipo inválido");
        }
        if (request.consultationId() != null) {
            var consultation = repository.findById(request.consultationId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Consulta inválida."));
            if (!consultation.cliente.id.equals(id) || !consultation.kind.equals("CONSULTATION") || request.kind() == CareRequest.Kind.CONSULTATION) bad("Consulta inválida para este registro.");
            ((com.fasterxml.jackson.databind.node.ObjectNode) payload).put("consultationId", consultation.id);
        }
        var entry = new CareEntry();
        entry.cliente = client; entry.author = author; entry.authorName = author.nome;
        entry.requestId = request.requestId().toString(); entry.kind = request.kind().name();
        entry.entryDate = request.date(); entry.returnDate = request.returnDate();
        entry.title = request.title().trim(); entry.notes = request.notes().trim(); entry.anamnesis = request.anamnesis().trim();
        entry.payload = payload.toString(); entry.createdAt = Instant.now();
        entry.version = repository.findFirstByCliente_IdAndKindOrderByIdDesc(id, entry.kind).map(p -> p.version + 1).orElse(1);
        return view(repository.saveAndFlush(entry));
    }
    public static double calculate(CareRequest.Energy input) {
        double weight = input.weightKg(), height = input.heightCm();
        if (!Double.isFinite(weight) || !Double.isFinite(height) || (input.activityFactor() != null && !Double.isFinite(input.activityFactor()))) bad("Valores não finitos.");
        double value = input.method() == CareRequest.Method.harris1984
            ? input.sex() == CareRequest.Sex.male
                ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * input.age()
                : 447.593 + 9.247 * weight + 3.098 * height - 4.330 * input.age()
            : 10 * weight + 6.25 * height - 5 * input.age() + (input.sex() == CareRequest.Sex.male ? 5 : -161);
        if (!Double.isFinite(value) || value <= 0) bad("Dados não produzem estimativa válida.");
        return value;
    }
    private View view(CareEntry entry) {
        try {
            return new View(entry.id, entry.cliente.id, entry.kind, entry.entryDate, entry.returnDate, entry.title,
                entry.notes, entry.anamnesis, mapper.readTree(entry.payload), entry.version, entry.authorName, entry.createdAt);
        } catch (java.io.IOException e) { throw new IllegalStateException("Registro inválido", e); }
    }
    private static void bad(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
