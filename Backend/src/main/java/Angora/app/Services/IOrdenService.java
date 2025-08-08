package Angora.app.Services;

import Angora.app.Entities.Orden;

import java.util.List;

public interface IOrdenService {

    List<Orden> listarOrdenes();
    Orden crearOrden(Orden orden);
    Orden obtenerOrdenPorId(Long id);
    Orden actualizarOrden(Orden orden);
    boolean eliminarOrden(Long id);
    // void confirmarOrden(Orden orden);
}