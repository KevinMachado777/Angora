package Angora.app.Repositories;

import Angora.app.Entities.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrdenRepository extends JpaRepository<Orden, Long> {

    // Busca órdenes dentro de un rango de fechas (para reportes de egresos)
    @Query("SELECT o FROM Orden o WHERE (:fechaInicio IS NULL OR o.fechaOrden >= :fechaInicio) AND (:fechaFin IS NULL OR o.fechaOrden <= :fechaFin)")
    List<Orden> findByFechaBetween(@Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);
}
