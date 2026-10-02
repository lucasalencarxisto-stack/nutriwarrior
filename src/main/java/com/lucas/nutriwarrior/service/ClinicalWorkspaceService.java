package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.AppointmentRequest;
import com.lucas.nutriwarrior.model.dto.PatientNoteRequest;
import com.lucas.nutriwarrior.model.entity.*;
import com.lucas.nutriwarrior.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

@Service
public class ClinicalWorkspaceService {
    private static final Set<String> APPOINTMENT_STATUSES =
        Set.of("SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED");

    private final ClienteAccessService access;
    private final ClienteRepository clientes;
    private final AppointmentRepository appointments;
    private final PatientNoteRepository notes;
    private final CareEntryRepository careEntries;
    private final DiaRegistroRepository days;

    public ClinicalWorkspaceService(
            ClienteAccessService access,
            ClienteRepository clientes,
            AppointmentRepository appointments,
            PatientNoteRepository notes,
            CareEntryRepository careEntries,
            DiaRegistroRepository days) {
        this.access = access;
        this.clientes = clientes;
        this.appointments = appointments;
        this.notes = notes;
        this.careEntries = careEntries;
        this.days = days;
    }

    public record AppointmentView(
        Long id, Long clienteId, String patient, Instant startsAt,
        String status, String notes, Instant updatedAt
    ) {}

    public record NoteView(
        Long id, Long clienteId, String author, String content, Instant createdAt
    ) {}

    public record NotificationView(
        String type, String severity, Long clienteId, String patient,
        String title, String message, String date
    ) {}

    @Transactional(readOnly = true)
    public List<AppointmentView> agenda() {
        var user = access.exigirRole(Role.NUTRICIONISTA);
        return appointments.findAllByNutricionista_IdOrderByStartsAtAsc(user.id)
            .stream().map(this::appointmentView).toList();
    }

    @Transactional
    public AppointmentView createAppointment(Long clienteId, AppointmentRequest request) {
        var nutricionista = access.exigirRole(Role.NUTRICIONISTA);
        var cliente = access.exigirAcesso(clienteId);
        if (request.startsAt() == null) bad("Informe data e horario da consulta.");

        var appointment = new Appointment();
        appointment.cliente = cliente;
        appointment.nutricionista = nutricionista;
        appointment.startsAt = request.startsAt();
        appointment.status = normalizeStatus(
            request.status() == null ? "SCHEDULED" : request.status()
        );
        appointment.notes = clean(request.notes());
        return appointmentView(appointments.saveAndFlush(appointment));
    }

    @Transactional
    public AppointmentView updateAppointment(
            Long clienteId, Long appointmentId, AppointmentRequest request) {
        access.exigirRole(Role.NUTRICIONISTA);
        access.exigirAcesso(clienteId);
        var appointment = ownedAppointment(clienteId, appointmentId);

        if (request.startsAt() != null) appointment.startsAt = request.startsAt();
        if (request.status() != null) appointment.status = normalizeStatus(request.status());
        if (request.notes() != null) appointment.notes = clean(request.notes());

        return appointmentView(appointments.saveAndFlush(appointment));
    }

    @Transactional
    public void deleteAppointment(Long clienteId, Long appointmentId) {
        access.exigirRole(Role.NUTRICIONISTA);
        access.exigirAcesso(clienteId);
        appointments.delete(ownedAppointment(clienteId, appointmentId));
    }

    @Transactional(readOnly = true)
    public AppointmentView nextAppointment(Long clienteId) {
        access.exigirAcesso(clienteId);
        Instant now = Instant.now();
        return appointments.findAllByCliente_IdOrderByStartsAtAsc(clienteId)
            .stream()
            .filter(item -> item.startsAt.isAfter(now))
            .filter(item -> !item.status.equals("CANCELLED"))
            .filter(item -> !item.status.equals("COMPLETED"))
            .findFirst().map(this::appointmentView).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<NoteView> listNotes(Long clienteId) {
        access.exigirRole(Role.NUTRICIONISTA);
        access.exigirAcesso(clienteId);
        return notes.findAllByCliente_IdOrderByCreatedAtDesc(clienteId)
            .stream().map(this::noteView).toList();
    }

    @Transactional
    public NoteView addNote(Long clienteId, PatientNoteRequest request) {
        var author = access.exigirRole(Role.NUTRICIONISTA);
        var cliente = access.exigirAcesso(clienteId);
        var note = new PatientNote();
        note.cliente = cliente;
        note.author = author;
        note.content = request.content().trim();
        return noteView(notes.saveAndFlush(note));
    }

    @Transactional
    public void deleteNote(Long clienteId, Long noteId) {
        access.exigirRole(Role.NUTRICIONISTA);
        access.exigirAcesso(clienteId);
        var note = notes.findById(noteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota nao encontrada"));
        if (!note.cliente.id.equals(clienteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota nao encontrada");
        }
        notes.delete(note);
    }

    @Transactional(readOnly = true)
    public List<NotificationView> notifications() {
        var user = access.exigirRole(Role.NUTRICIONISTA);
        var patientList = clientes.findAllByNutricionista_IdOrderByIdAsc(user.id);
        var output = new ArrayList<NotificationView>();
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        Instant now = Instant.now();

        appointments.findAllByNutricionista_IdOrderByStartsAtAsc(user.id).stream()
            .filter(item -> !item.status.equals("CANCELLED"))
            .filter(item -> !item.status.equals("COMPLETED"))
            .forEach(item -> {
                LocalDate date = item.startsAt.atZone(zone).toLocalDate();
                if (date.isBefore(today)) {
                    output.add(new NotificationView(
                        "APPOINTMENT_OVERDUE", "warning", item.cliente.id, item.cliente.nome,
                        "Consulta com horario passado",
                        "Revise o status ou reagende a consulta.", item.startsAt.toString()
                    ));
                } else if (date.equals(today)) {
                    output.add(new NotificationView(
                        "APPOINTMENT_TODAY", "info", item.cliente.id, item.cliente.nome,
                        "Consulta prevista para hoje",
                        "Abra a ficha para preparar o atendimento.", item.startsAt.toString()
                    ));
                }
            });

        for (var patient : patientList) {
            var lastPlan = careEntries.findFirstByCliente_IdAndKindOrderByIdDesc(patient.id, "PLAN");
            if (lastPlan.isEmpty()) {
                output.add(new NotificationView(
                    "NO_PLAN", "info", patient.id, patient.nome,
                    "Paciente sem plano publicado",
                    "Ainda nao existe plano alimentar vigente.", null
                ));
            } else if (lastPlan.get().createdAt.isBefore(now.minus(Duration.ofDays(42)))) {
                output.add(new NotificationView(
                    "STALE_PLAN", "info", patient.id, patient.nome,
                    "Plano publicado ha mais de 42 dias",
                    "Pode valer a pena revisar o plano na proxima consulta.",
                    lastPlan.get().createdAt.toString()
                ));
            }

            var patientDays = days.findAllByCliente_IdOrderByDataAsc(patient.id);
            var lastWeight = patientDays.stream()
                .filter(day -> day.pesoKg != null)
                .reduce((first, second) -> second);

            if (lastWeight.isEmpty()) {
                output.add(new NotificationView(
                    "NO_WEIGHT", "info", patient.id, patient.nome,
                    "Sem pesagem registrada",
                    "Ainda nao existe peso no diario deste paciente.", null
                ));
            } else if (lastWeight.get().data.isBefore(today.minusDays(14))) {
                output.add(new NotificationView(
                    "STALE_WEIGHT", "info", patient.id, patient.nome,
                    "Peso sem atualizacao recente",
                    "Ultima pesagem registrada ha mais de 14 dias.",
                    lastWeight.get().data.toString()
                ));
            }
        }

        return output;
    }

    private Appointment ownedAppointment(Long clienteId, Long appointmentId) {
        var appointment = appointments.findById(appointmentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Consulta agendada nao encontrada"
            ));
        if (!appointment.cliente.id.equals(clienteId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Consulta agendada nao encontrada"
            );
        }
        return appointment;
    }

    private AppointmentView appointmentView(Appointment item) {
        return new AppointmentView(
            item.id, item.cliente.id, item.cliente.nome, item.startsAt,
            item.status, item.notes, item.updatedAt
        );
    }

    private NoteView noteView(PatientNote note) {
        return new NoteView(
            note.id, note.cliente.id, note.author.nome, note.content, note.createdAt
        );
    }

    private static String normalizeStatus(String value) {
        String status = value.trim().toUpperCase(Locale.ROOT);
        if (!APPOINTMENT_STATUSES.contains(status)) bad("Status de consulta invalido.");
        return status;
    }

    private static String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private static void bad(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
