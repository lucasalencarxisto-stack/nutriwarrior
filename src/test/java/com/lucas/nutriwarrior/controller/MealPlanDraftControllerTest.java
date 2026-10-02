package com.lucas.nutriwarrior.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = AuthenticatedIntegrationTest.TEST_EMAIL, roles = "NUTRICIONISTA")
class MealPlanDraftControllerTest extends AuthenticatedIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    private long paciente() throws Exception {
        var response = mvc.perform(post("/nutricionistas/me/pacientes")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nome\":\"Paciente rascunho\",\"email\":\"draft@example.com\",\"senha\":\"senha12345\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).get("clienteId").asLong();
    }

    private Map<String, Object> body() {
        var body = new LinkedHashMap<String, Object>();
        body.put("title", "Plano inicial");
        body.put("notes", "Observacoes");
        body.put("meals", List.of(Map.of("name", "Almoco", "portions", "Arroz", "substitutions", "Batata")));
        return body;
    }

    @Test void criaBuscaAtualizaERejeitaVersaoDesatualizada() throws Exception {
        long id = paciente();
        mvc.perform(get("/clientes/{id}/plano-rascunho", id)).andExpect(status().isNoContent());
        var body = body();
        var response = mvc.perform(put("/clientes/{id}/plano-rascunho", id)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        mvc.perform(get("/clientes/{id}/plano-rascunho", id))
            .andExpect(status().isOk()).andExpect(jsonPath("$.meals[0].name").value("Almoco"));
        body.put("version", mapper.readTree(response).get("version").asLong());
        body.put("title", "Plano atualizado");
        mvc.perform(put("/clientes/{id}/plano-rascunho", id)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
            .andExpect(status().isOk());
        mvc.perform(put("/clientes/{id}/plano-rascunho", id)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
            .andExpect(status().isConflict());
        mvc.perform(get("/clientes/{id}/plano-rascunho", id))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Plano atualizado"));
    }

    @Test void rejeitaDadosInvalidos() throws Exception {
        long id = paciente();
        var body = body();
        body.put("meals", List.of(Map.of("name", "Almoco")));
        mvc.perform(put("/clientes/{id}/plano-rascunho", id)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/clientes/{id}/plano-rascunho", id)).andExpect(status().isNoContent());
    }

    @Test void pacienteNaoPodeLerOuSalvarRascunho() throws Exception {
        long id = paciente();
        mvc.perform(get("/clientes/{id}/plano-rascunho", id)
            .with(user("draft@example.com").roles("PACIENTE"))).andExpect(status().isForbidden());
        mvc.perform(put("/clientes/{id}/plano-rascunho", id)
            .with(user("draft@example.com").roles("PACIENTE"))
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body())))
            .andExpect(status().isForbidden());
    }
}