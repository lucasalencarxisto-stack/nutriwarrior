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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RefeicaoControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCompleteMealFlow() throws Exception {

        String clienteResponse = mvc.perform(
                post("/clientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "nome": "Lucas",
                          "pesoAtualKg": 74.8
                        }
                        """)
            )
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        long clienteId = objectMapper
            .readTree(clienteResponse)
            .get("id")
            .asLong();

        mvc.perform(
                post("/clientes/{clienteId}/dias", clienteId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "data": "2026-09-24"
                        }
                        """)
            )
            .andExpect(status().isCreated());

        String refeicaoResponse = mvc.perform(
                post(
                    "/clientes/{clienteId}/dias/{data}/refeicoes",
                    clienteId,
                    "2026-09-24"
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "tipo": "ALMOCO",
                          "horario": "12:30:00"
                        }
                        """)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.tipo").value("ALMOCO"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode json = objectMapper.readTree(refeicaoResponse);
        long refeicaoId = json.get("id").asLong();

        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-24",
                    refeicaoId
                )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tipo").value("ALMOCO"));

        mvc.perform(
                put(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-24",
                    refeicaoId
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "tipo": "JANTAR",
                          "horario": "20:00:00"
                        }
                        """)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tipo").value("JANTAR"));

        mvc.perform(
                delete(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-24",
                    refeicaoId
                )
            )
            .andExpect(status().isNoContent());

        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-24",
                    refeicaoId
                )
            )
            .andExpect(status().isNotFound());
    }
}