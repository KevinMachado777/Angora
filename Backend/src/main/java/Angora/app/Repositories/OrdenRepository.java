package Angora.app.Repositories;

import Angora.app.Entities.OrdenSimulador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrdenRepository extends JpaRepository<OrdenSimulador, Long> {
    @Query("SELECT o FROM OrdenSimulador o WHERE (:fechaInicio IS NULL OR o.fechaOrden >= :fechaInicio) AND (:fechaFin IS NULL OR o.fechaOrden <= :fechaFin)")
    List<OrdenSimulador> findByFechaRange(LocalDateTime fechaInicio, LocalDateTime fechaFin);
}