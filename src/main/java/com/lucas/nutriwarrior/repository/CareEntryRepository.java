package com.lucas.nutriwarrior.repository;
import com.lucas.nutriwarrior.model.entity.CareEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CareEntryRepository extends JpaRepository<CareEntry, Long> {
    List<CareEntry> findAllByCliente_IdOrderByIdDesc(Long id);
    Optional<CareEntry> findByCliente_IdAndRequestId(Long id, String requestId);
    Optional<CareEntry> findFirstByCliente_IdAndKindOrderByIdDesc(Long id, String kind);
    List<CareEntry> findAllByCliente_Nutricionista_IdAndKindOrderByIdDesc(Long authorId, String kind);
}
