package Angora.app.Repositories;

import Angora.app.Entities.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {
    @Query("SELECT l FROM Lote l WHERE l.idMateria = :idMateria ORDER BY l.fechaIngreso DESC")
    Optional<Lote> findTopByIdMateriaOrderByFechaIngresoDesc(Long idMateria);
}