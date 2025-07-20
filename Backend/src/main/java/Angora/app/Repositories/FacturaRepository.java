package Angora.app.Repositories;

import Angora.app.Entities.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

// Repositorio para manejar facturas en la base de datos
@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {

    // Busca todas las facturas de una cartera por su ID
    @Query("SELECT f FROM Factura f WHERE f.idCartera.idCartera = :idCartera")
    List<Factura> findByIdCarteraIdCartera(@Param("idCartera") Long idCartera);

    //
    @Query("SELECT f FROM Factura f WHERE (:fechaInicio IS NULL OR f.fecha >= :fechaInicio) AND (:fechaFin IS NULL OR f.fecha <= :fechaFin)")
    List<Factura> findByFechaRange(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    // Verifica si existe una factura con ese ID en la BD
    boolean existsByIdFactura(Long idFactura);
}