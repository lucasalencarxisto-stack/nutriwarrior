package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
