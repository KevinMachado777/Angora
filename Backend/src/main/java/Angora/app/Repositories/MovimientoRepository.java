package Angora.app.Repositories;

import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Entities.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

// Repositorio de movimientos
@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {

    // Consulta para contar movimientos asociados a un producto en un rango de fechas
    @Query("SELECT COUNT(m) FROM Movimiento m WHERE m.producto = :producto AND (:fechaInicio IS NULL OR m.fechaMovimiento >= :fechaInicio) AND (:fechaFin IS NULL OR m.fechaMovimiento <= :fechaFin)")
    Long countByProductoAndFechaBetween(@Param("producto") Producto producto, @Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);

    // Consulta para contar movimientos asociados a una materia prima en un rango de fechas
    @Query("SELECT COUNT(m) FROM Movimiento m WHERE m.materiaPrima = :materiaPrima AND (:fechaInicio IS NULL OR m.fechaMovimiento >= :fechaInicio) AND (:fechaFin IS NULL OR m.fechaMovimiento <= :fechaFin)")
    Long countByMateriaPrimaAndFechaBetween(@Param("materiaPrima") MateriaPrima materiaPrima, @Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);

    // Metodos nuevos
    @Query("SELECT m FROM Movimiento m WHERE (:fechaInicio IS NULL OR m.fechaMovimiento >= :fechaInicio) AND (:fechaFin IS NULL OR m.fechaMovimiento <= :fechaFin)")
    List<Movimiento> findByFechaBetween(@Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);

    List<Movimiento> findByProducto_IdProducto(Long idProducto);

    List<Movimiento> findByMateriaPrima_IdMateria(Long idMateria);

}