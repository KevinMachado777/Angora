package Angora.app.Repositories;

import Angora.app.Entities.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrdenRepository extends JpaRepository<Orden, Long> {
    List<Orden> findByEstadoFalse();

    @Query("SELECT o FROM Orden o WHERE (:fechaInicio IS NULL OR o.fecha >= :fechaInicio) AND (:fechaFin IS NULL OR o.fecha <= :fechaFin)")
    List<Orden> findByFechaBetween(@Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);
}