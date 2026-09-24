package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
	Optional<Cliente> findByUsuario_Id(Long usuarioId);

	List<Cliente> findAllByNutricionista_IdOrderByIdAsc(Long nutricionistaId);
}
