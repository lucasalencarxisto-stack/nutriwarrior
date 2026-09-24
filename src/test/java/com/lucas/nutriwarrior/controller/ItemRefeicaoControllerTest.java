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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ItemRefeicaoControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCalculateNutritionBasedOnQuantity() throws Exception {

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
            .andReturn()
            .getResponse()
            .getContentAsString();

        long refeicaoId = objectMapper
            .readTree(refeicaoResponse)
            .get("id")
            .asLong();

        String foodResponse = mvc.perform(
                post("/api/foods")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "name": "Peito de frango",
                          "calories": 165,
                          "protein": 31,
                          "carbs": 0,
                          "fat": 3.6
                        }
                        """)
            )
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        long foodItemId = objectMapper
            .readTree(foodResponse)
            .get("id")
            .asLong();

        mvc.perform(
                post(
                    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}/itens",
                    clienteId,
                    "2026-09-24",
                    refeicaoId
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "foodItemId": %d,
                          "quantidadeGramas": 180
                        }
                        """.formatted(foodItemId))
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.alimento").value("Peito de frango"))
            .andExpect(jsonPath("$.quantidadeGramas").value(180.0))
            .andExpect(jsonPath("$.kcal").value(297.0))
            .andExpect(jsonPath("$.proteinasGramas").value(55.8))
            .andExpect(jsonPath("$.carboidratosGramas").value(0.0))
            .andExpect(jsonPath("$.gordurasGramas").value(6.48));
    }
}