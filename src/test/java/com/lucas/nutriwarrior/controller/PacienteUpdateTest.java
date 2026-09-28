package com.lucas.nutriwarrior.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = AuthenticatedIntegrationTest.TEST_EMAIL, roles = "NUTRICIONISTA")
class PacienteUpdateTest extends AuthenticatedIntegrationTest {
    private static final String PATH = "/nutricionistas/me/pacientes";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;

    private JsonNode create() throws Exception {
        return mapper.readTree(mvc.perform(post(PATH).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("nome", "Paciente", "email", "edit@example.com",
                "telefone", "(13) 99999-1234", "senha", "senhaOriginal123"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void updatesBothNamesNormalizesContactAndPreservesPassword() throws Exception {
        JsonNode patient = create();
        long id = patient.get("clienteId").asLong();
        String hash = usuarios.findByEmail("edit@example.com").orElseThrow().senhaHash;
        mvc.perform(patch(PATH + "/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("nome", " Nome Novo ",
                "email", "NOVO@EXAMPLE.COM", "telefone", "(11) 98888-7777"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Nome Novo"))
            .andExpect(jsonPath("$.email").value("novo@example.com"))
            .andExpect(jsonPath("$.telefone").value("+5511988887777"));
        mvc.perform(get("/clientes/{id}", id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.nome").value("Nome Novo"));
        assertEquals(hash, usuarios.findByEmail("novo@example.com").orElseThrow().senhaHash);
        mvc.perform(get(PATH)).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].email").value("novo@example.com"));
    }

    @Test
    void clearsPhoneChangesPasswordAndAcceptsUnchangedEmail() throws Exception {
        long id = create().get("clienteId").asLong();
        mvc.perform(patch(PATH + "/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("telefone", "", "email", "edit@example.com",
                "senha", "novaSenha123"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.telefone").doesNotExist());
        var patient = usuarios.findByEmail("edit@example.com").orElseThrow();
        assertNull(patient.telefone);
        assertTrue(encoder.matches("novaSenha123", patient.senhaHash));
        assertFalse(encoder.matches("senhaOriginal123", patient.senhaHash));
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        long id = create().get("clienteId").asLong();
        mvc.perform(patch(PATH + "/{id}", id).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("email", TEST_EMAIL))))
            .andExpect(status().isConflict());
    }

    @Test
    void rejectsInvalidFields() throws Exception {
        long id = create().get("clienteId").asLong();
        for (var body : java.util.List.of(Map.of("email", ""), Map.of("email", "invalid"),
                Map.of("nome", " "), Map.of("senha", "short"), Map.of("telefone", "123"))) {
            mvc.perform(patch(PATH + "/{id}", id).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body))).andExpect(status().isBadRequest());
        }
    }

    @Test
    void rejectsAnotherNutritionistAndPatientRole() throws Exception {
        long id = create().get("clienteId").asLong();
        mvc.perform(post("/auth/register/nutricionista").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("nome", "Outro", "email", "other@example.com",
                "senha", "senhaOutro123")))).andExpect(status().isCreated());
        mvc.perform(patch(PATH + "/{id}", id).with(user("other@example.com").roles("NUTRICIONISTA"))
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(patch(PATH + "/{id}", id).with(user("edit@example.com").roles("PACIENTE"))
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
    }
}
