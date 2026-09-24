package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.MetaNutricional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MetaNutricionalRepository extends JpaRepository<MetaNutricional, Long> {
    Optional<MetaNutricional> findByCliente_Id(Long clienteId);
}