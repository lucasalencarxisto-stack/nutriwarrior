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

        // 1. Cria cliente
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

        // 2. Cria dia
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
            .andExpect(status().isCreated());

        // 3. Cria refeicao
        String refeicaoBody = """
            {
              "tipo": "ALMOCO",
              "horario": "12:30:00"
            }
            """;

        String refeicaoResponse = mvc.perform(
                post(
                    "/clientes/{clienteId}/dias/{data}/refeicoes",
                    clienteId,
                    "2026-09-23"
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(refeicaoBody)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.tipo").value("ALMOCO"))
            .andExpect(jsonPath("$.horario").value("12:30:00"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode refeicaoJson =
            objectMapper.readTree(refeicaoResponse);

        long refeicaoId =
            refeicaoJson.get("id").asLong();

        // 4. Lista refeicoes do dia
        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}/refeicoes",
                    clienteId,
                    "2026-09-23"
                )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].tipo").value("ALMOCO"));

        // 5. Busca refeicao pelo ID
        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-23",
                    refeicaoId
                )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tipo").value("ALMOCO"));

        // 6. Atualiza refeicao
        String updateBody = """
            {
              "tipo": "JANTAR",
              "horario": "20:00:00"
            }
            """;

        mvc.perform(
                put(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-23",
                    refeicaoId
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(updateBody)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tipo").value("JANTAR"))
            .andExpect(jsonPath("$.horario").value("20:00:00"));

        // 7. Deleta
        mvc.perform(
                delete(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-23",
                    refeicaoId
                )
            )
            .andExpect(status().isNoContent());

        // 8. Confirma que nao existe mais
        mvc.perform(
                get(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}",
                    clienteId,
                    "2026-09-23",
                    refeicaoId
                )
            )
            .andExpect(status().isNotFound());
    }
}