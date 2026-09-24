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
import com.lucas.nutriwarrior.repository.UsuarioRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UsuarioRepository usuarioRepository;

    @Test
    void shouldRegisterLoginExposeMeAndRejectAnonymousAccess() throws Exception {
        registrar("Ana", "ana.security@example.com");
        var usuario = usuarioRepository.findByEmail("ana.security@example.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals("senhaSegura123", usuario.senhaHash);
        org.junit.jupiter.api.Assertions.assertTrue(usuario.senhaHash.startsWith("$2"));

        mvc.perform(post("/auth/register/nutricionista")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro("Ana", "ana.security@example.com")))
            .andExpect(status().isConflict());

        String token = login("ana.security@example.com");
        mvc.perform(get("/me").header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("ana.security@example.com"))
            .andExpect(jsonPath("$.role").value("NUTRICIONISTA"))
            .andExpect(jsonPath("$.clienteId").doesNotExist());

        mvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Anonimo\"}"))
            .andExpect(status().isUnauthorized());

        mvc.perform(get("/me").header("Authorization", "Bearer token-invalido"))
            .andExpect(status().isUnauthorized());

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana.security@example.com\",\"senha\":\"errada123\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldIsolatePatientsAndRestrictFoodWrites() throws Exception {
        String anaToken = loginAfterRegister("ana.owner@example.com");
        String biaToken = loginAfterRegister("bia.owner@example.com");
        JsonNode anaPatient = criarPaciente(anaToken, "paciente.ana@example.com");
        JsonNode biaPatient = criarPaciente(biaToken, "paciente.bia@example.com");
        long anaClienteId = anaPatient.get("clienteId").asLong();
        long biaClienteId = biaPatient.get("clienteId").asLong();

        mvc.perform(get("/nutricionistas/me/pacientes").header("Authorization", bearer(anaToken)))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].clienteId").value(anaClienteId));
        mvc.perform(get("/clientes/{id}", anaClienteId).header("Authorization", bearer(anaToken)))
            .andExpect(status().isOk());
        mvc.perform(get("/clientes/{id}", biaClienteId).header("Authorization", bearer(anaToken)))
            .andExpect(status().isForbidden());

        String patientToken = login("paciente.ana@example.com");
        mvc.perform(get("/clientes/{id}", anaClienteId).header("Authorization", bearer(patientToken)))
            .andExpect(status().isOk());
        mvc.perform(get("/clientes/{id}", biaClienteId).header("Authorization", bearer(patientToken)))
            .andExpect(status().isForbidden());

        mvc.perform(post("/api/foods").header("Authorization", bearer(anaToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Arroz\",\"calories\":130,\"protein\":2.7,\"carbs\":28,\"fat\":0.3}"))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/foods").header("Authorization", bearer(patientToken)))
            .andExpect(status().isOk());
        mvc.perform(post("/api/foods").header("Authorization", bearer(patientToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Feijao\",\"calories\":100,\"protein\":5,\"carbs\":18,\"fat\":1}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowPatientToCreateAndReadOwnDailyRegister() throws Exception {
        String nutritionistToken = loginAfterRegister("owner.flow@example.com");
        JsonNode patient = criarPaciente(nutritionistToken, "patient.flow@example.com");
        String patientToken = login("patient.flow@example.com");
        long clienteId = patient.get("clienteId").asLong();

        mvc.perform(post("/clientes/{id}/dias", clienteId)
                .header("Authorization", bearer(patientToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"data\":\"2026-09-24\"}"))
            .andExpect(status().isCreated());
        mvc.perform(get("/clientes/{id}/dias/2026-09-24", clienteId)
                .header("Authorization", bearer(patientToken)))
            .andExpect(status().isOk());
    }

    private void registrar(String nome, String email) throws Exception {
        mvc.perform(post("/auth/register/nutricionista")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro(nome, email)))
            .andExpect(status().isCreated());
    }

    private String loginAfterRegister(String email) throws Exception {
        registrar("Nutri", email);
        return login(email);
    }

    private String login(String email) throws Exception {
        String response = mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"senhaSegura123\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    private JsonNode criarPaciente(String token, String email) throws Exception {
        String response = mvc.perform(post("/nutricionistas/me/pacientes")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Paciente\",\"email\":\"" + email
                    + "\",\"senha\":\"senhaSegura123\",\"pesoAtualKg\":74.8}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private String registro(String nome, String email) {
        return "{\"nome\":\"" + nome + "\",\"email\":\"" + email
            + "\",\"senha\":\"senhaSegura123\"}";
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}