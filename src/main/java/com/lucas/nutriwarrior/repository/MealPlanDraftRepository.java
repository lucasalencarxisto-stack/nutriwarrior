package com.lucas.nutriwarrior.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lucas.nutriwarrior.model.entity.MealPlanDraft;

public interface MealPlanDraftRepository
        extends JpaRepository<MealPlanDraft, Long> {

    Optional<MealPlanDraft> findByCliente_Id(Long clienteId);
}