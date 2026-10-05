package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.PatientNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientNoteRepository extends JpaRepository<PatientNote, Long> {
    List<PatientNote> findAllByCliente_IdOrderByCreatedAtDesc(Long clienteId);
}
