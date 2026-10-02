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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
class ClinicalWorkspaceControllerTest extends AuthenticatedIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private long patient() throws Exception {
        String response = mvc.perform(
                post("/nutricionistas/me/pacientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of(
                        "nome", "Paciente Clinical",
                        "email", "clinical@example.com",
                        "senha", "senha12345"
                    )))
            )
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        return mapper.readTree(response).get("clienteId").asLong();
    }

    @Test
    void agendaNotesTagsAndNextAppointmentWork() throws Exception {
        long id = patient();
        String startsAt = Instant.now()
            .plus(2, ChronoUnit.DAYS)
            .truncatedTo(ChronoUnit.SECONDS)
            .toString();

        String appointment = mvc.perform(
                post("/clientes/{id}/agenda", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of(
                        "startsAt", startsAt,
                        "status", "SCHEDULED",
                        "notes", "Retorno mensal"
                    )))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.clienteId").value(id))
            .andExpect(jsonPath("$.status").value("SCHEDULED"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long appointmentId = mapper.readTree(appointment).get("id").asLong();

        mvc.perform(get("/nutricionistas/me/agenda"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].clienteId").value(id));

        mvc.perform(
                get("/clientes/{id}/proxima-consulta", id)
                    .with(user("clinical@example.com").roles("PACIENTE"))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(appointmentId));

        mvc.perform(
                patch("/clientes/{id}/agenda/{appointmentId}", id, appointmentId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"CONFIRMED\"}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"));

        String note = mvc.perform(
                post("/clientes/{id}/notas-internas", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"content\":\"Revisar exames no retorno\"}")
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.content").value("Revisar exames no retorno"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long noteId = mapper.readTree(note).get("id").asLong();

        mvc.perform(get("/clientes/{id}/notas-internas", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(noteId));

        mvc.perform(
                get("/clientes/{id}/notas-internas", id)
                    .with(user("clinical@example.com").roles("PACIENTE"))
            )
            .andExpect(status().isForbidden());

        mvc.perform(
                patch("/nutricionistas/me/pacientes/{id}", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of(
                        "tags", List.of("Vegetariano", "Retorno pendente")
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tags[0]").value("vegetariano"))
            .andExpect(jsonPath("$.tags[1]").value("retorno pendente"));

        mvc.perform(delete("/clientes/{id}/notas-internas/{noteId}", id, noteId))
            .andExpect(status().isNoContent());
    }

    @Test
    void assistedConsultationPersistsChecklist() throws Exception {
        long id = patient();

        mvc.perform(
                post("/clientes/{id}/care", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of(
                        "requestId", UUID.randomUUID().toString(),
                        "kind", "CONSULTATION",
                        "date", java.time.LocalDate.now().toString(),
                        "title", "Consulta assistida",
                        "notes", "Conduta registrada",
                        "anamnesis", "",
                        "checklist", List.of(
                            "Peso atualizado",
                            "Retorno definido"
                        )
                    )))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.payload.checklist[0]").value("Peso atualizado"))
            .andExpect(jsonPath("$.payload.checklist[1]").value("Retorno definido"));
    }

    @Test
    void patientCannotManageAgenda() throws Exception {
        long id = patient();

        mvc.perform(
                post("/clientes/{id}/agenda", id)
                    .with(user("clinical@example.com").roles("PACIENTE"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of(
                        "startsAt", Instant.now().plus(1, ChronoUnit.DAYS).toString()
                    )))
            )
            .andExpect(status().isForbidden());

        mvc.perform(
                get("/nutricionistas/me/notificacoes")
                    .with(user("clinical@example.com").roles("PACIENTE"))
            )
            .andExpect(status().isForbidden());
    }
}
