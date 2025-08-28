package Angora.app.Utils;

import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Entities.Producto;
import Angora.app.Repositories.MovimientoRepository;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// Componente listener que registra movimientos en la tabla Movimiento al actualizar entidades
@Component
public class MovimientoListener {

    // Inyección del EntityManager para acceder a la base de datos
    @PersistenceContext
    private EntityManager entityManager;

    // Inyección del repositorio de movimiento
    @Autowired
    private MovimientoRepository movimientoRepository;

    // Metodo que se ejecuta antes de actualizar una entidad en la base de datos
    // Registra un movimiento si se detecta un cambio en la cantidad de Producto o MateriaPrima
    @PreUpdate
    @Transactional
    public void onUpdate(Object entity) {
        if (entity instanceof Producto) {
            Producto p = (Producto) entity;
            // Busca el estado anterior de la entidad en la base de datos para comparar
            Producto previous = entityManager.find(Producto.class, p.getIdProducto());
            Float cantidadAnterior = (previous != null && previous.getCantidad() != null) ? previous.getCantidad() : 0.0f; // Valor anterior o 0 si no existe
            Float nuevaCantidad = p.getCantidad() != null ? p.getCantidad() : 0.0f; // Nuevo valor o 0 si nulo

            // Verifica si hay un cambio significativo en la cantidad
            if (previous != null && !cantidadAnterior.equals(nuevaCantidad)) {
                Movimiento m = new Movimiento();
                m.setProducto(p);
                m.setCantidadAnterior(cantidadAnterior); // Registra la cantidad antes del cambio
                m.setCantidadCambio(Math.abs(nuevaCantidad - cantidadAnterior)); // Calcula la diferencia
                m.setTipoMovimiento(nuevaCantidad > cantidadAnterior ? "entrada" : "salida"); // Determina si es entrada o salida
                m.setFechaMovimiento(LocalDateTime.now()); // Establece la fecha y hora actual
                movimientoRepository.save(m);
            }
        } else if (entity instanceof MateriaPrima) {
            MateriaPrima m = (MateriaPrima) entity;
            // Busca el estado anterior de la entidad en la base de datos
            MateriaPrima previous = entityManager.find(MateriaPrima.class, m.getIdMateria());
            Float cantidadAnterior = (previous != null && previous.getCantidad() != null) ? previous.getCantidad() : 0.0f;
            Float nuevaCantidad = m.getCantidad() != null ? m.getCantidad() : 0.0f;

            // Verifica si hay un cambio significativo en la cantidad
            if (previous != null && !cantidadAnterior.equals(nuevaCantidad)) {
                Movimiento mvt = new Movimiento();
                mvt.setMateriaPrima(m);
                mvt.setCantidadAnterior(cantidadAnterior);
                mvt.setCantidadCambio(Math.abs(nuevaCantidad - cantidadAnterior));
                mvt.setTipoMovimiento(nuevaCantidad > cantidadAnterior ? "entrada" : "salida");
                mvt.setFechaMovimiento(LocalDateTime.now());
                movimientoRepository.save(mvt);
            }
        }
    }
}