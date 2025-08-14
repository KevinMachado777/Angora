package Angora.app.Services;

import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Entities.Producto;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.MovimientoRepository;
import Angora.app.Repositories.ProductoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class MovimientoInventarioService {

    @Autowired
    private MovimientoRepository movimientoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private EntityManager entityManager;


     // Descontar stock por venta y registra movimiento de producto (salida)
    @Transactional
    public void descontarPorVenta(Long idProducto, Integer cantidad) {
        if (idProducto == null || cantidad == null) {
            throw new RuntimeException("idProducto o cantidad inválidos");
        }

        Producto producto = entityManager.find(Producto.class, idProducto, LockModeType.PESSIMISTIC_WRITE);
        if (producto == null) {
            throw new RuntimeException("Producto no encontrado: " + idProducto);
        }
        Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
        int nuevoStock = stockActual - cantidad;
        if (nuevoStock < 0) {
            throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
        }

        // crear movimiento producto (snapshot)
        Movimiento movimiento = new Movimiento();
        movimiento.setProducto(producto);
        movimiento.setCantidadAnterior(stockActual.floatValue());
        movimiento.setCantidadCambio((float) Math.abs(cantidad));
        movimiento.setCantidadActual((float) nuevoStock);
        movimiento.setTipoMovimiento("salida");
        movimiento.setFechaMovimiento(LocalDateTime.now());
        movimientoRepository.save(movimiento);

        // actualizar stock
        producto.setStock(nuevoStock);
        productoRepository.save(producto);
    }


     // Ajustar stock manualmente (por producción manual, ajustes, etc).
    @Transactional
    public void ajustarStockProducto(Long idProducto, Integer cantidadAjuste, String motivo) {
        if (idProducto == null || cantidadAjuste == null) {
            throw new RuntimeException("idProducto o cantidadAjuste inválidos");
        }

        Producto producto = entityManager.find(Producto.class, idProducto, LockModeType.PESSIMISTIC_WRITE);
        if (producto == null) {
            throw new RuntimeException("Producto no encontrado: " + idProducto);
        }
        Integer stockAnterior = producto.getStock() != null ? producto.getStock() : 0;
        int stockNuevo = stockAnterior + cantidadAjuste;

        Movimiento movimiento = new Movimiento();
        movimiento.setProducto(producto);
        movimiento.setCantidadAnterior(stockAnterior.floatValue());
        movimiento.setCantidadCambio((float) Math.abs(cantidadAjuste));
        movimiento.setCantidadActual((float) stockNuevo);
        movimiento.setTipoMovimiento(cantidadAjuste > 0 ? "entrada" : "salida");
        movimiento.setFechaMovimiento(LocalDateTime.now());
        movimientoRepository.save(movimiento);

        producto.setStock(stockNuevo);
        productoRepository.save(producto);
    }

    //Crea un movimiento de materia prima
    @Transactional
    public void crearMovimientoMateria(MateriaPrima materia, Float cantidadAnterior, Float cantidadActual, String tipoMovimiento) {
        if (materia == null) return;
        Movimiento mov = new Movimiento();
        mov.setMateriaPrima(materia);
        mov.setCantidadAnterior(cantidadAnterior != null ? cantidadAnterior : 0f);
        Float cambio = (cantidadAnterior != null && cantidadActual != null) ? Math.abs(cantidadActual - cantidadAnterior) : Math.abs((cantidadActual != null ? cantidadActual : 0f) - (cantidadAnterior != null ? cantidadAnterior : 0f));
        mov.setCantidadCambio(cambio);
        mov.setCantidadActual(cantidadActual != null ? cantidadActual : 0f);
        mov.setTipoMovimiento(tipoMovimiento != null ? tipoMovimiento : ( (cambio >= 0) ? "entrada" : "salida"));
        mov.setFechaMovimiento(LocalDateTime.now());
        movimientoRepository.save(mov);
    }

}
