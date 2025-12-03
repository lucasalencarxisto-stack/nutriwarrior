package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.DiaRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DiaRegistroRepository extends JpaRepository<DiaRegistro, Long> {

    Optional<DiaRegistro> findByClienteIdAndData(Long clienteId, LocalDate data);
}
