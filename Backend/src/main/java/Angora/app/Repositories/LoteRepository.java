package Angora.app.Repositories;

import Angora.app.Entities.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoteRepository extends JpaRepository<Lote, String> {

    Optional<Lote> findTopByIdMateriaOrderByFechaIngresoDescIdLoteDesc(String idMateria);

    // Verifica la cantidad disponible de una materia
    @Query("SELECT SUM(l.cantidadDisponible) FROM Lote l WHERE l.idMateria = :idMateria")
    Float sumCantidadDisponibleByIdMateria(@Param("idMateria") String idMateria);

    // Filtra lotes disponibles con FIFO y cantidad mínima dinámica
    @Query("SELECT l FROM Lote l WHERE l.idMateria = :idMateria AND l.cantidadDisponible > :cantidadMinima ORDER BY l.fechaIngreso")
    List<Lote> findByIdMateriaAndCantidadDisponibleGreaterThan(@Param("idMateria") String idMateria, @Param("cantidadMinima") Float cantidadMinima);

    // Incluir los lotes manuales como fechas de ingreso
    @Query("SELECT l FROM Lote l " +
            "WHERE (:fechaInicio IS NULL OR l.fechaIngreso >= :fechaInicio) " +
            "AND   (:fechaFin    IS NULL OR l.fechaIngreso <= :fechaFin)")
    List<Lote> findByFechaIngresoBetween(@Param("fechaInicio") LocalDateTime fechaInicio,
                                         @Param("fechaFin") LocalDateTime fechaFin);

    // Metodo para buscar los lotes asociados a una materia
    @Query("SELECT l FROM Lote l WHERE l.idMateria = :idMateria")
    List<Lote> findByIdMateria(@Param("idMateria") String idMateria);
}
