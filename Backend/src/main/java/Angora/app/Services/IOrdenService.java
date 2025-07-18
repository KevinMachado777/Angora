package Angora.app.Services;

import Angora.app.Entities.Orden;

import java.util.List;

public interface IOrdenService {

    public List<Orden> listarOrdenes();
    public void agregarOrden(Orden orden);
    public void eliminarOrden(Long idOrden);
    // public void confirmarOrden(Orden orden);
}
