package com.lucas.nutriwarrior.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(username = AuthenticatedIntegrationTest.TEST_EMAIL, roles = "NUTRICIONISTA")
class DiaRegistroControllerTest extends AuthenticatedIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCompleteDailyRegisterFlow() throws Exception {

        String clienteBody = """
            {
              "nome": "Lucas",
              "pesoAtualKg": 74.8
            }
            """;

        String clienteResponse = mvc.perform(
                post("/clientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(clienteBody)
            )
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode clienteJson =
            objectMapper.readTree(clienteResponse);

        long clienteId =
            clienteJson.get("id").asLong();

        String diaBody = """
            {
              "data": "2026-09-23"
            }
            """;

        mvc.perform(
                post("/clientes/{clienteId}/dias", clienteId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(diaBody)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.clienteId").value(clienteId))
            .andExpect(jsonPath("$.data").value("2026-09-23"));

        mvc.perform(
                get("/clientes/{clienteId}/dias", clienteId)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].data")
                .value("2026-09-23"));

        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}",
                    clienteId,
                    "2026-09-23"
                )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data")
                .value("2026-09-23"));

        mvc.perform(
                post("/clientes/{clienteId}/dias", clienteId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(diaBody)
            )
            .andExpect(status().isConflict());

        mvc.perform(
                delete(
                    "/clientes/{clienteId}/dias/{data}",
                    clienteId,
                    "2026-09-23"
                )
            )
            .andExpect(status().isNoContent());

        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}",
                    clienteId,
                    "2026-09-23"
                )
            )
            .andExpect(status().isNotFound());
    }
}