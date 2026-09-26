package com.lucas.nutriwarrior.assistant;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class InvalidLlmResponseException extends ResponseStatusException {
    public InvalidLlmResponseException() {
        super(HttpStatus.BAD_REQUEST, "Resposta invalida do assistente");
    }
}
