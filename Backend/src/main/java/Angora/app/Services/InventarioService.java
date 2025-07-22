package Angora.app.Services;

import Angora.app.Entities.Movimiento;
import Angora.app.Entities.Producto;
import Angora.app.Repositories.MovimientoRepository;
import Angora.app.Repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class InventarioService {
    @Autowired
    private MovimientoRepository movimientoRepository;
    @Autowired
    private ProductoRepository productoRepository;

    public void actualizarProducto(Long idProducto, Float nuevaCantidad) {
        Producto p = productoRepository.findById(idProducto).orElseThrow();
        Float cantidadAnterior = p.getCantidad();
        p.setStock(nuevaCantidad);
        productoRepository.save(p);
        Movimiento m = new Movimiento();
        m.setProducto(p);
        m.setCantidadAnterior(cantidadAnterior);
        m.setCantidadCambio(nuevaCantidad - cantidadAnterior);
        m.setTipoMovimiento(nuevaCantidad > cantidadAnterior ? "entrada" : "salida");
        m.setFechaMovimiento(LocalDateTime.now());
        movimientoRepository.save(m);
    }
}