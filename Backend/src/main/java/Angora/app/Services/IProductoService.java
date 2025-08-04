package Angora.app.Services;

import Angora.app.Entities.Producto;

import java.util.List;

public interface IProductoService {

    public List<Producto> listarProductos();
    public void disminuirStock(Producto producto, int cantidadComprada);
}
