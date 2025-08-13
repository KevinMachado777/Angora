package Angora.app.Repositories;

import Angora.app.Entities.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {
    void deleteByIdMateria(Long idMateria);

    // Metodos nuevos
    // Verifica la cantidad disponible de una materia
    @Query("SELECT SUM(l.cantidadDisponible) FROM Lote l WHERE l.idMateria = :idMateria")
    Float sumCantidadDisponibleByIdMateria(@Param("idMateria") Long idMateria);

    // Filtra lotes disponibles con FIFO y cantidad mínima dinámica
    @Query("SELECT l FROM Lote l WHERE l.idMateria = :idMateria AND l.cantidadDisponible > :cantidadMinima ORDER BY l.fechaIngreso")
    List<Lote> findByIdMateriaAndCantidadDisponibleGreaterThan(@Param("idMateria") Long idMateria, @Param("cantidadMinima") Float cantidadMinima);
}
