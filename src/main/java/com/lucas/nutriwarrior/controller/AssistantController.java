package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.assistant.AssistantChatExecuteRequest;
import com.lucas.nutriwarrior.assistant.AssistantChatExecuteResponse;
import com.lucas.nutriwarrior.assistant.AssistantChatRequest;
import com.lucas.nutriwarrior.assistant.AssistantChatResponse;
import com.lucas.nutriwarrior.assistant.AssistantService;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.service.ClienteAccessService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final ClienteAccessService accessService;

    public AssistantController(AssistantService assistantService, ClienteAccessService accessService) {
        this.assistantService = assistantService;
        this.accessService = accessService;
    }

    @PostMapping("/chat")
    public AssistantChatResponse chat(
            @Valid @RequestBody AssistantChatRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Usuario usuario = accessService.usuarioAtual();
        return assistantService.chat(request.message, request.clienteId, usuario);
    }

    @PostMapping("/execute")
    public AssistantChatExecuteResponse execute(
            @Valid @RequestBody AssistantChatExecuteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Usuario usuario = accessService.usuarioAtual();
        return assistantService.execute(request.confirmationId(), usuario);
    }
}