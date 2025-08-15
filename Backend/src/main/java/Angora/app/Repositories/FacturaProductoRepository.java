package Angora.app.Repositories;

import Angora.app.Entities.FacturaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FacturaProductoRepository extends JpaRepository<FacturaProducto, Long> {
    List<FacturaProducto> findByFacturaIdFacturaIn(List<Long> facturaIds);

    @Query("SELECT fp.producto.id, fp.producto.nombre, SUM(fp.cantidad) as totalCantidad, " +
            "SUM(fp.cantidad * fp.precioUnitario) as totalVentas " +
            "FROM FacturaProducto fp " +
            "WHERE fp.factura.fecha BETWEEN :fechaInicio AND :fechaFin " +
            "GROUP BY fp.producto.id, fp.producto.nombre " +
            "ORDER BY totalCantidad DESC")
    List<Object[]> findTopProductosByFecha(@Param("fechaInicio") LocalDateTime fechaInicio,
                                           @Param("fechaFin") LocalDateTime fechaFin,
                                           Pageable pageable);

    @Query("SELECT fp FROM FacturaProducto fp WHERE fp.factura.fecha BETWEEN :fechaInicio AND :fechaFin")
    List<FacturaProducto> findByFacturaFechaBetween(@Param("fechaInicio") LocalDateTime fechaInicio,
                                                    @Param("fechaFin") LocalDateTime fechaFin);
}