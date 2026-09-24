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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(username = AuthenticatedIntegrationTest.TEST_EMAIL, roles = "NUTRICIONISTA")
class CoreApiMvpControllerTest extends AuthenticatedIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldSumItemsAcrossMealsAndApplyGoals() throws Exception {
        long clienteId = criarCliente();
        mvc.perform(post("/clientes/{id}/dias", clienteId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"data":"2026-09-24","pesoKg":74.8,"aguaMl":2200}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.pesoKg").value(74.8))
            .andExpect(jsonPath("$.aguaMl").value(2200));

        long almoco = criarRefeicao(clienteId, "ALMOCO");
        long jantar = criarRefeicao(clienteId, "JANTAR");
        long foodId = criarFood();
        adicionarItem(clienteId, almoco, foodId, 180);
        adicionarItem(clienteId, jantar, foodId, 100);

        mvc.perform(put("/clientes/{id}/metas", clienteId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"calorias":400,"proteinasGramas":100,"aguaMl":2500}
                    """))
            .andExpect(status().isOk());

        mvc.perform(get("/clientes/{id}/dias/2026-09-24/resumo", clienteId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.calorias").value(462.0))
            .andExpect(jsonPath("$.proteinasGramas").value(86.8))
            .andExpect(jsonPath("$.quantidadeRefeicoes").value(2))
            .andExpect(jsonPath("$.quantidadeItens").value(2))
            .andExpect(jsonPath("$.pesoKg").value(74.8))
            .andExpect(jsonPath("$.aguaMl").value(2200))
            .andExpect(jsonPath("$.metaCalorias").value(400.0))
            .andExpect(jsonPath("$.caloriasRestantes").value(-62.0))
            .andExpect(jsonPath("$.aguaRestanteMl").value(300));
    }

    @Test
    void shouldReturnStandardErrorsForInvalidAndMissingResources() throws Exception {
        mvc.perform(get("/clientes/999999/dias/2026-09-24/resumo"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.path").value("/clientes/999999/dias/2026-09-24/resumo"));

        mvc.perform(post("/clientes/999999/dias")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    private long criarCliente() throws Exception {
        String response = mvc.perform(post("/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Teste\",\"pesoAtualKg\":74.8}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private long criarRefeicao(long clienteId, String tipo) throws Exception {
        String response = mvc.perform(post("/clientes/{id}/dias/2026-09-24/refeicoes", clienteId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"tipo\":\"" + tipo + "\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private long criarFood() throws Exception {
        String response = mvc.perform(post("/api/foods")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Frango\",\"calories\":165,\"protein\":31,\"carbs\":0,\"fat\":3.6}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private void adicionarItem(long clienteId, long refeicaoId, long foodId,
            int quantidade) throws Exception {
        mvc.perform(post("/clientes/{id}/dias/2026-09-24/refeicoes/{refeicao}/itens",
                clienteId, refeicaoId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"foodItemId\":" + foodId
                    + ",\"quantidadeGramas\":" + quantidade + "}"))
            .andExpect(status().isCreated());
    }
}