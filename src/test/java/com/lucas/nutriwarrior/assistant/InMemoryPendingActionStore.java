package com.lucas.nutriwarrior.assistant;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class InMemoryPendingActionStore implements PendingActionStore {

    private final ConcurrentMap<String, PendingAction> store = new ConcurrentHashMap<>();

    @Override
    public PendingAction create(PendingAction action) {
        store.entrySet().removeIf(entry -> entry.getValue().expired());
        store.putIfAbsent(action.id(), action);
        return action;
    }

    @Override
    public PendingAction require(String confirmationId) {
        PendingAction action = store.get(confirmationId);
        if (action == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Acao nao encontrada");
        }
        if (action.expired()) {
            store.remove(confirmationId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Acao expirada");
        }
        if (action.consumed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Acao ja consumida");
        }
        return action;
    }

    @Override
    public PendingAction consume(String confirmationId, Long userId) {
        return store.compute(confirmationId, (id, action) -> {
            if (action == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Acao nao encontrada");
            }
            if (!Objects.equals(action.userId(), userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acao nao pertence ao usuario autenticado");
            }
            if (action.expired()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Acao expirada");
            }
            if (action.consumed()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Acao ja consumida");
            }
            return action.consumedCopy();
        });
    }
}
