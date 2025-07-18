package Angora.app.Services;

import Angora.app.Entities.Cartera;

import java.util.List;

public interface ICarteraService {
    // Obtiene una cartera por el ID del cliente
    Cartera obtenerPorIdCliente(Long idCliente);

    // Obtiene todas las carteras activas
    List<Cartera> obtenerCarterasActivas();

    // Procesa un abono para una cartera
    Cartera procesarAbono(Long idCliente, Double cantidad, String fecha, Long idFactura);

    // Actualizar el estado de una cartera
    Cartera actualizarEstadoCartera(Long idCliente, Boolean estado);

    // Obtiene las facturas por un cliente
    Cartera obtenerPorIdClienteConFacturas(Long idCliente);
}
