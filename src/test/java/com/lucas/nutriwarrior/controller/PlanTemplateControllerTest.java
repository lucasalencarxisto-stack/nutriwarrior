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

import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(
    username = AuthenticatedIntegrationTest.TEST_EMAIL,
    roles = "NUTRICIONISTA"
)
class PlanTemplateControllerTest extends AuthenticatedIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private Map<String, Object> body(String name) {
        return Map.of(
            "name", name,
            "title", "Plano base",
            "notes", "Orientacoes gerais",
            "meals", List.of(
                Map.of(
                    "name", "Cafe da manha",
                    "portions", "2 ovos e 1 fruta",
                    "substitutions", "Iogurte natural"
                )
            )
        );
    }

    @Test
    void nutritionistCanCreateListUpdateAndDeleteTemplate() throws Exception {
        String created = mvc.perform(
                post("/nutricionistas/me/plan-templates")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(body("Modelo A")))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Modelo A"))
            .andExpect(jsonPath("$.meals[0].name").value("Cafe da manha"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long id = mapper.readTree(created).get("id").asLong();

        mvc.perform(get("/nutricionistas/me/plan-templates"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id));

        mvc.perform(
                put("/nutricionistas/me/plan-templates/{id}", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(body("Modelo atualizado")))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Modelo atualizado"));

        mvc.perform(delete("/nutricionistas/me/plan-templates/{id}", id))
            .andExpect(status().isNoContent());

        mvc.perform(get("/nutricionistas/me/plan-templates"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void patientCannotAccessTemplates() throws Exception {
        mvc.perform(
                get("/nutricionistas/me/plan-templates")
                    .with(user("paciente@example.com").roles("PACIENTE"))
            )
            .andExpect(status().isForbidden());

        mvc.perform(
                post("/nutricionistas/me/plan-templates")
                    .with(user("paciente@example.com").roles("PACIENTE"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(body("Bloqueado")))
            )
            .andExpect(status().isForbidden());
    }
}
