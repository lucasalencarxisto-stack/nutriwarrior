package com.lucas.nutriwarrior.controller;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
@WithMockUser(username = AuthenticatedIntegrationTest.TEST_EMAIL, roles = "NUTRICIONISTA")
class CareControllerTest extends AuthenticatedIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    long patient() throws Exception {
        return mapper.readTree(mvc.perform(post("/nutricionistas/me/pacientes").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("nome","Paciente", "email","care@example.com","senha","senha12345"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("clienteId").asLong();
    }
    Map<String,Object> body(String kind) {
        var map = new HashMap<String,Object>();
        map.put("requestId", UUID.randomUUID().toString()); map.put("kind",kind); map.put("date", LocalDate.now().toString());
        map.put("title","Atendimento"); map.put("notes","Observações"); map.put("anamnesis",""); return map;
    }
    JsonNode save(long id, Map<String,Object> body) throws Exception {
        return mapper.readTree(mvc.perform(post("/clientes/{id}/care", id).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(body))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    @Test void consultationsArePrivateAndFollowUpsAreListed() throws Exception {
        long id = patient(); var b = body("CONSULTATION"); b.put("anamnesis","Anotação privada"); b.put("returnDate", LocalDate.now().plusDays(30).toString()); save(id,b);
        mvc.perform(get("/clientes/{id}/care",id)).andExpect(status().isOk()).andExpect(jsonPath("$[0].anamnesis").value("Anotação privada"));
        mvc.perform(get("/clientes/{id}/care",id).with(user("care@example.com").roles("PACIENTE"))).andExpect(status().isForbidden());
        mvc.perform(post("/clientes/{id}/care",id).with(user("care@example.com").roles("PACIENTE")).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(b))).andExpect(status().isForbidden());
        mvc.perform(get("/nutricionistas/me/retornos")).andExpect(status().isOk()).andExpect(jsonPath("$[0].clienteId").value(id));
    }
    @Test void plansAreVersionedIdempotentAndPatientGetsOnlyLatestPlan() throws Exception {
        long id = patient(); save(id,body("CONSULTATION")); var b = body("PLAN"); b.put("meals",List.of(Map.of("name","Almoço","portions","Arroz: 3 colheres","substitutions","Batata: 1 unidade")));
        var first = save(id,b); assertEquals(first.get("id"), save(id,b).get("id"));
        b.put("requestId",UUID.randomUUID().toString()); b.put("title","Plano atualizado"); var second = save(id,b); assertEquals(2,second.get("version").asInt());
        mvc.perform(get("/clientes/{id}/plano-vigente",id).with(user("care@example.com").roles("PACIENTE")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Plano atualizado")).andExpect(jsonPath("$.anamnesis").value(""));
        mvc.perform(get("/clientes/{id}/care",id)).andExpect(jsonPath("$.length()").value(3));
    }
    @Test void energyIsCalculatedOnServerAndPreservesInputs() throws Exception {
        long id = patient(); var consultation = save(id,body("CONSULTATION")); var b = body("ENERGY"); b.put("consultationId",consultation.get("id").asLong()); b.put("energy",Map.of("method","harris1984","sex","male","weightKg",80,"heightCm",180,"age",40,"activityFactor",1.5));
        var result=save(id,b); assertEquals(1796.862,result.at("/payload/restingKcal").asDouble(),0.000001);
        assertEquals(2695.293,result.at("/payload/totalKcal").asDouble(),0.000001);
        assertEquals(80,result.at("/payload/input/weightKg").asInt());
        assertEquals(consultation.get("id").asLong(),result.at("/payload/consultationId").asLong());
    }
    @Test void anotherPatientCannotSeePlanAndPatientCannotReadProfessionalReturns() throws Exception {
        long id = patient();
        mvc.perform(post("/nutricionistas/me/pacientes").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("nome","Outro paciente","email","second-care@example.com","senha","senha12345"))))
            .andExpect(status().isCreated());
        mvc.perform(get("/clientes/{id}/plano-vigente",id).with(user("second-care@example.com").roles("PACIENTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/nutricionistas/me/retornos").with(user("care@example.com").roles("PACIENTE"))).andExpect(status().isForbidden());
    }
    @Test void energyCannotLinkToAnotherPatientsConsultation() throws Exception {
        long id=patient();
        long otherId=mapper.readTree(mvc.perform(post("/nutricionistas/me/pacientes").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("nome","Outro paciente","email","linked-care@example.com","senha","senha12345"))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("clienteId").asLong();
        var consultation=save(otherId,body("CONSULTATION")); var b=body("ENERGY");
        b.put("consultationId",consultation.get("id").asLong());
        b.put("energy",Map.of("method","mifflin1990","sex","male","weightKg",80,"heightCm",180,"age",40));
        mvc.perform(post("/clientes/{id}/care",id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(b))).andExpect(status().isBadRequest());
    }
    @Test void otherNutritionistCannotReadOrWrite() throws Exception {
        long id = patient(); mvc.perform(post("/auth/register/nutricionista").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("nome","Outro","email","other-care@example.com","senha","senha12345")))).andExpect(status().isCreated());
        for(String endpoint: List.of("care","plano-vigente")) mvc.perform(get("/clientes/{id}/"+endpoint,id).with(user("other-care@example.com").roles("NUTRICIONISTA"))).andExpect(status().isForbidden());
        mvc.perform(post("/clientes/{id}/care",id).with(user("other-care@example.com").roles("NUTRICIONISTA")).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body("CONSULTATION")))).andExpect(status().isForbidden());
    }
    @Test void invalidRecordsAreRejected() throws Exception {
        long id=patient();
        var future=body("CONSULTATION"); future.put("date",LocalDate.now().plusDays(1).toString());
        var plan=body("PLAN"); plan.put("meals",List.of());
        var energy=body("ENERGY"); energy.put("energy",Map.of("method","mifflin1990","sex","male","weightKg",80,"heightCm",180,"age",17));
        var wrong=body("PLAN"); wrong.put("anamnesis","private");
        for(var b:List.of(future,plan,energy,wrong)) mvc.perform(post("/clientes/{id}/care",id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(b))).andExpect(status().isBadRequest());
    }
    @Test void deletingPatientCascadesNewRecords() throws Exception {
        long id=patient(); save(id,body("CONSULTATION"));
        mvc.perform(delete("/nutricionistas/me/pacientes/{id}",id)).andExpect(status().isNoContent());
        mvc.perform(get("/clientes/{id}/care",id)).andExpect(status().isNotFound());
    }
}
