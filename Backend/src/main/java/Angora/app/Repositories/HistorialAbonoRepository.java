package Angora.app.Repositories;

import Angora.app.Entities.HistorialAbono;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialAbonoRepository extends JpaRepository<HistorialAbono, Long> {

    // Obtiene el historial de abonos de un cliente ordenado por fecha descendente
    List<HistorialAbono> findByClienteIdClienteOrderByFechaAbonoDesc(Long idCliente);

    // Obtiene el historial de abonos de una factura específica
    List<HistorialAbono> findByFacturaIdFacturaOrderByFechaAbonoDesc(Long idFactura);

    // Contar total de abonos por cliente
    @Query("SELECT COUNT(h) FROM HistorialAbono h WHERE h.cliente.idCliente = ?1")
    Long countByClienteId(Long idCliente);
}