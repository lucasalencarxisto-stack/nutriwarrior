package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.PlanTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanTemplateRepository extends JpaRepository<PlanTemplate, Long> {
    List<PlanTemplate> findAllByAuthor_IdOrderByUpdatedAtDesc(Long authorId);
    Optional<PlanTemplate> findByIdAndAuthor_Id(Long id, Long authorId);
}
