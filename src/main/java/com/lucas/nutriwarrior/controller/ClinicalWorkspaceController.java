package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.AppointmentRequest;
import com.lucas.nutriwarrior.model.dto.PatientNoteRequest;
import com.lucas.nutriwarrior.service.ClinicalWorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class ClinicalWorkspaceController {
    private final ClinicalWorkspaceService service;

    public ClinicalWorkspaceController(ClinicalWorkspaceService service) {
        this.service = service;
    }

    @GetMapping("/nutricionistas/me/agenda")
    public List<ClinicalWorkspaceService.AppointmentView> agenda() {
        return service.agenda();
    }

    @PostMapping("/clientes/{clienteId}/agenda")
    @ResponseStatus(HttpStatus.CREATED)
    public ClinicalWorkspaceService.AppointmentView createAppointment(
            @PathVariable Long clienteId,
            @Valid @RequestBody AppointmentRequest request) {
        return service.createAppointment(clienteId, request);
    }

    @PatchMapping("/clientes/{clienteId}/agenda/{appointmentId}")
    public ClinicalWorkspaceService.AppointmentView updateAppointment(
            @PathVariable Long clienteId,
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequest request) {
        return service.updateAppointment(clienteId, appointmentId, request);
    }

    @DeleteMapping("/clientes/{clienteId}/agenda/{appointmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAppointment(
            @PathVariable Long clienteId,
            @PathVariable Long appointmentId) {
        service.deleteAppointment(clienteId, appointmentId);
    }

    @GetMapping("/clientes/{clienteId}/proxima-consulta")
    public ResponseEntity<ClinicalWorkspaceService.AppointmentView> nextAppointment(
            @PathVariable Long clienteId) {
        var appointment = service.nextAppointment(clienteId);
        return appointment == null
            ? ResponseEntity.noContent().build()
            : ResponseEntity.ok(appointment);
    }

    @GetMapping("/clientes/{clienteId}/notas-internas")
    public List<ClinicalWorkspaceService.NoteView> notes(@PathVariable Long clienteId) {
        return service.listNotes(clienteId);
    }

    @PostMapping("/clientes/{clienteId}/notas-internas")
    @ResponseStatus(HttpStatus.CREATED)
    public ClinicalWorkspaceService.NoteView addNote(
            @PathVariable Long clienteId,
            @Valid @RequestBody PatientNoteRequest request) {
        return service.addNote(clienteId, request);
    }

    @DeleteMapping("/clientes/{clienteId}/notas-internas/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(
            @PathVariable Long clienteId,
            @PathVariable Long noteId) {
        service.deleteNote(clienteId, noteId);
    }

    @GetMapping("/nutricionistas/me/notificacoes")
    public List<ClinicalWorkspaceService.NotificationView> notifications() {
        return service.notifications();
    }
}
