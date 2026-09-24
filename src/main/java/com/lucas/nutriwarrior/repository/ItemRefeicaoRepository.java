package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.ItemRefeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRefeicaoRepository
        extends JpaRepository<ItemRefeicao, Long> {

    List<ItemRefeicao> findAllByRefeicao_IdOrderByIdAsc(
        Long refeicaoId
    );

    Optional<ItemRefeicao> findByIdAndRefeicao_Id(
        Long id,
        Long refeicaoId
    );
}