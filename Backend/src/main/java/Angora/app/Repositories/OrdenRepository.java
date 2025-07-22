package Angora.app.Repositories;

import Angora.app.Entities.OrdenSimulador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

// Repositorio para manejar órdenes de compra
@Repository
public interface OrdenRepository extends JpaRepository<OrdenSimulador, Long> {

    // Busca órdenes dentro de un rango de fechas (para reportes de egresos)
    @Query("SELECT o FROM OrdenSimulador o WHERE (:fechaInicio IS NULL OR o.fechaOrden >= :fechaInicio) AND (:fechaFin IS NULL OR o.fechaOrden <= :fechaFin)")
    List<OrdenSimulador> findByFechaBetween(@Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);
}