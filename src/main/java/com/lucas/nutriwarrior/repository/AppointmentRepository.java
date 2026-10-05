package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findAllByNutricionista_IdOrderByStartsAtAsc(Long nutricionistaId);
    List<Appointment> findAllByCliente_IdOrderByStartsAtAsc(Long clienteId);
}
