package Angora.app.Repositories;

import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Entities.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    @Query("SELECT COUNT(m) FROM Movimiento m WHERE m.producto = :producto AND (:fechaInicio IS NULL OR m.fechaMovimiento >= :fechaInicio) AND (:fechaFin IS NULL OR m.fechaMovimiento <= :fechaFin)")
    Long countByProductoAndFechaBetween(@Param("producto") Producto producto, @Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);

    @Query("SELECT COUNT(m) FROM Movimiento m WHERE m.materiaPrima = :materiaPrima AND (:fechaInicio IS NULL OR m.fechaMovimiento >= :fechaInicio) AND (:fechaFin IS NULL OR m.fechaMovimiento <= :fechaFin)")
    Long countByMateriaPrimaAndFechaBetween(@Param("materiaPrima") MateriaPrima materiaPrima, @Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);
}