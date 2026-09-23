package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.Refeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefeicaoRepository extends JpaRepository<Refeicao, Long> {

    List<Refeicao> findAllByDiaRegistro_IdOrderByHorarioAsc(
        Long diaRegistroId
    );

    Optional<Refeicao> findByIdAndDiaRegistro_Id(
        Long id,
        Long diaRegistroId
    );
}