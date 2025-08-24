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

    // Busca todas las facturas de una cartera por su ID (para portafolio)
    @Query("SELECT f FROM Factura f WHERE f.idCartera.idCartera = :idCartera AND f.estado != 'PENDIENTE'")
    List<Factura> findByIdCarteraIdCartera(@Param("idCartera") Long idCartera);

    // Verifica si existe una factura con ese ID en la BD (para portafolio)
    boolean existsByIdFactura(Long idFactura);

    // Busca facturas dentro de un rango de fechas (para reportes)
    @Query("SELECT f FROM Factura f WHERE (:fechaInicio IS NULL OR f.fecha >= :fechaInicio) AND (:fechaFin IS NULL OR f.fecha <= :fechaFin)")
    List<Factura> findByFechaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    // Busca facturas de un cajero específico dentro de un rango de fechas (para reportes de personal)
    @Query("SELECT f FROM Factura f WHERE f.cajero.id = :idCajero AND (:fechaInicio IS NULL OR f.fecha >= :fechaInicio) AND (:fechaFin IS NULL OR f.fecha <= :fechaFin)")
    List<Factura> findByCajeroAndFechaBetween(@Param("idCajero") Long idCajero, LocalDateTime fechaInicio, LocalDateTime fechaFin);

    // Busca facturas asociadas a un cajero específico (sin filtro de fecha)
    @Query("SELECT f FROM Factura f WHERE f.cajero.id = :idCajero")
    List<Factura> findByCajero(@Param("idCajero") Long idCajero);

    // Cuenta el número de facturas por cliente (sin filtro de fecha)
    @Query("SELECT COUNT(f) FROM Factura f WHERE f.cliente.idCliente = :idCliente")
    Long countByIdCliente(@Param("idCliente") Long idCliente);

    // Cuenta el número de facturas por cliente dentro de un rango de fechas (para reportes de clientes)
    @Query("SELECT COUNT(f) FROM Factura f WHERE f.cliente.idCliente = :idCliente AND (:fechaInicio IS NULL OR f.fecha >= :fechaInicio) AND (:fechaFin IS NULL OR f.fecha <= :fechaFin)")
    Long countByIdClienteAndFechaBetween(@Param("idCliente") Long idCliente, LocalDateTime fechaInicio, LocalDateTime fechaFin);

    // Busca las facturas asociadas a un cliente
    @Query("SELECT f FROM Factura f WHERE f.cliente.idCliente = :idCliente")
    List<Factura> findByIdCliente(@Param("idCliente") Long idCliente);

    @Query("SELECT f FROM Factura f LEFT JOIN FETCH f.cliente JOIN FETCH f.cajero WHERE f.estado = :estado")
    List<Factura> findByEstado(String estado);

    Long countByFechaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    @Query("SELECT COUNT(DISTINCT f.cliente.idCliente) FROM Factura f WHERE f.fecha BETWEEN :fechaInicio AND :fechaFin")
    Long countDistinctClientesByFechaBetween(@Param("fechaInicio") LocalDateTime fechaInicio,
                                             @Param("fechaFin") LocalDateTime fechaFin);

    @Query("SELECT f FROM Factura f LEFT JOIN FETCH f.cajero WHERE f.estado = ?1")
    List<Factura> findByEstadoWithCajeroLeftJoin(String estado);
}
