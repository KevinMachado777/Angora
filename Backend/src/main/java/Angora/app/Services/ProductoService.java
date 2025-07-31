package Angora.app.Services;

import Angora.app.Entities.Producto;
import Angora.app.Repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService implements IProductoService{

    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public List<Producto> listarProductos() {
        List<Producto> productos = productoRepository.findAll();
        return productos;
    }

    @Override
    public void disminuirStock(Producto producto, int cantidadComprada) {
        producto.setStock(producto.getStock() - cantidadComprada);
        productoRepository.save(producto);
    }
}
