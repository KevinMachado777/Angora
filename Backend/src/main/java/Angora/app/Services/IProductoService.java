package Angora.app.Services;

import Angora.app.Entities.Producto;

import java.util.List;

public interface IProductoService {
    List<Producto> listarProductos();
    void disminuirStock(Producto producto, int cantidadComprada);

    // Nuevo metodo
    Producto updateStock(Long idProducto, int nuevaCantidad);
}