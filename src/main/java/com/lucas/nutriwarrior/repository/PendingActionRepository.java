package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.entity.AssistantPendingAction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PendingActionRepository extends JpaRepository<AssistantPendingAction, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select action from AssistantPendingAction action where action.id = :id")
    Optional<AssistantPendingAction> findForConsumption(@Param("id") String id);
}
