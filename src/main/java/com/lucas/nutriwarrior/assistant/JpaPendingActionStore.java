package com.lucas.nutriwarrior.assistant;

import com.lucas.nutriwarrior.model.entity.AssistantPendingAction;
import com.lucas.nutriwarrior.repository.PendingActionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.Objects;

@Component
public class JpaPendingActionStore implements PendingActionStore {
    private final PendingActionRepository repository;
    private final PendingActionPayloadCodec codec;

    public JpaPendingActionStore(PendingActionRepository repository, PendingActionPayloadCodec codec) {
        this.repository = repository;
        this.codec = codec;
    }

    @Override
    @Transactional
    public PendingAction create(PendingAction action) {
        if (action.consumed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Acao ja consumida");
        }
        AssistantPendingAction entity = new AssistantPendingAction();
        entity.id = action.id();
        entity.userId = action.userId();
        entity.clienteId = action.clienteId();
        entity.intent = action.intent().name();
        entity.payloadJson = codec.encode(action.intent(), action.payload());
        entity.createdAt = action.createdAt();
        entity.expiresAt = action.expiresAt();
        // A null @Version makes this an INSERT; duplicate IDs cannot overwrite existing actions.
        repository.saveAndFlush(entity);
        return toAction(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public PendingAction require(String confirmationId) {
        AssistantPendingAction entity = repository.findById(confirmationId).orElseThrow(this::notFound);
        requireAvailable(entity, Instant.now());
        return toAction(entity);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PendingAction consume(String confirmationId, Long userId) {
        // Lock and commit in an independent transaction: domain rollback must not restore confirmation.
        AssistantPendingAction entity = repository.findForConsumption(confirmationId).orElseThrow(this::notFound);
        if (!Objects.equals(entity.userId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acao nao pertence ao usuario autenticado");
        }
        Instant now = Instant.now();
        requireAvailable(entity, now);
        PendingAction action = toAction(entity); // Validate before changing state.
        entity.consumedAt = now;
        repository.flush();
        return action.consumedCopy();
    }

    private void requireAvailable(AssistantPendingAction entity, Instant now) {
        if (!now.isBefore(entity.expiresAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Acao expirada");
        }
        if (entity.consumedAt != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Acao ja consumida");
        }
    }

    private PendingAction toAction(AssistantPendingAction entity) {
        AssistantIntent intent;
        try {
            intent = AssistantIntent.valueOf(entity.intent);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Intent da acao pendente invalida");
        }
        return new PendingAction(entity.id, entity.userId, entity.clienteId, intent,
            codec.decode(intent, entity.payloadJson), entity.createdAt, entity.expiresAt,
            entity.consumedAt != null);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Acao nao encontrada");
    }
}
