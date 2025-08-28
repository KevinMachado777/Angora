package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Controllers.dto.OrdenConfirmacionDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Orden;
import Angora.app.Entities.OrdenMateriaPrima;
import Angora.app.Entities.Movimiento; // Añadir import para Movimiento
import Angora.app.Repositories.*;
import Angora.app.Services.Email.EnviarCorreo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrdenService implements IOrdenService {

    @Autowired
    private OrdenRepository ordenRepository;

    @Autowired
    private LoteService loteService;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private MateriaPrimaService materiaPrimaService;

    @Autowired
    private OrdenMateriaPrimaRepository ordenMateriaPrimaRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private MovimientoRepository movimientoRepository;

    @Autowired
    private EnviarCorreo enviarCorreo;

    @Override
    public List<Orden> listarOrdenes() {
        return ordenRepository.findAllWithDetails();
    }

    @Override
    @Transactional
    public Orden crearOrden(Orden orden) {
        try {
            // Validaciones
            if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
                throw new RuntimeException("El proveedor es obligatorio");
            }
            if (orden.getOrdenMateriaPrimas() == null || orden.getOrdenMateriaPrimas().isEmpty()) {
                throw new RuntimeException("La orden debe contener al menos una materia prima");
            }

            // Establecer valores por defecto (estado y fecha)
            orden.setEstado(false);
            orden.setFecha(LocalDateTime.now());

            // Asociar cada ítem de materia prima a la orden principal.
            for (OrdenMateriaPrima item : orden.getOrdenMateriaPrimas()) {
                // Asignar la referencia de la orden principal a cada item
                item.setOrden(orden);
                // Si el costo unitario es null, inicializarlo para evitar un error.
                if (item.getCostoUnitario() == null) {
                    item.setCostoUnitario(0);
                }
            }

            // Guardar la orden principal.
            Orden savedOrden = ordenRepository.save(orden);

            return savedOrden;
        } catch (Exception e) {
            System.err.println("Error al crear la orden: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al crear la orden: " + e.getMessage(), e);
        }
    }

    @Override
    public Orden obtenerOrdenPorId(Long id) {
        return ordenRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Orden actualizarOrden(Orden orden) {
        if (orden.getIdOrden() == null) {
            throw new RuntimeException("El ID de la orden es obligatorio para la actualización.");
        }

        Orden existingOrden = ordenRepository.findById(orden.getIdOrden())
                .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + orden.getIdOrden()));

        if (orden.getProveedor() == null || orden.getProveedor().getIdProveedor() == null) {
            throw new RuntimeException("El proveedor es obligatorio.");
        }
        if (orden.getOrdenMateriaPrimas() == null || orden.getOrdenMateriaPrimas().isEmpty()) {
            throw new RuntimeException("La orden debe contener al menos una materia prima.");
        }

        // Actualizar los campos de la Orden principal
        existingOrden.setProveedor(orden.getProveedor());
        existingOrden.setNotas(orden.getNotas());
        existingOrden.setTotal(orden.getTotal());

        // Sincronizar la colección de OrdenMateriaPrima
        existingOrden.getOrdenMateriaPrimas().clear();

        // Agregar todos los nuevos ítems a la lista de la orden existente
        for (OrdenMateriaPrima newItem : orden.getOrdenMateriaPrimas()) {
            newItem.setOrden(existingOrden); // Asegurarse de que cada ítem tenga la referencia a la orden
            existingOrden.getOrdenMateriaPrimas().add(newItem);
        }

        return ordenRepository.save(existingOrden);
    }

    @Override
    public boolean eliminarOrden(Long id) {
        if (!ordenRepository.existsById(id)) {
            return false;
        }
        try {
            ordenRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar la orden: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void confirmarOrden(Long idOrden, OrdenConfirmacionDTO ordenConfirmacion) {
        Optional<Orden> ordenOpt = ordenRepository.findById(idOrden);
        if (ordenOpt.isEmpty()) {
            throw new RuntimeException("Orden no encontrada");
        }

        Orden orden = ordenOpt.get();

        // Validar que no haya IDs de lote duplicados
        List<String> idsLotes = new ArrayList<>();
        if (ordenConfirmacion.getLotesIds() != null) {
            idsLotes = new ArrayList<>(ordenConfirmacion.getLotesIds().values());
        } else if (ordenConfirmacion.getLotes() != null) {
            idsLotes = ordenConfirmacion.getLotes().stream()
                    .map(LoteDTO::getIdLote)
                    .collect(Collectors.toList());
        }

        Set<String> idsUnicos = new HashSet<>(idsLotes);
        if (idsLotes.size() != idsUnicos.size()) {
            throw new RuntimeException("No se permiten IDs de lote duplicados");
        }

        // Crear los lotes para cada materia prima
        List<Lote> lotes = new ArrayList<>();

        if (ordenConfirmacion.getLotes() != null && !ordenConfirmacion.getLotes().isEmpty()) {
            // Nuevo formato: usar los lotes directamente del DTO
            for (LoteDTO loteDTO : ordenConfirmacion.getLotes()) {
                if (loteDTO.getIdLote() == null || loteDTO.getIdLote().trim().isEmpty()) {
                    throw new RuntimeException("Falta el ID de lote para la materia: " + loteDTO.getIdMateria());
                }

                // Verificar que el ID de lote no exista ya
                if (loteRepository.existsById(loteDTO.getIdLote())) {
                    throw new RuntimeException("El ID de lote '" + loteDTO.getIdLote() + "' ya existe");
                }

                // Obtener la materia prima para registrar el movimiento
                MateriaPrima materia = materiaPrimaRepository.findById(loteDTO.getIdMateria())
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + loteDTO.getIdMateria()));
                Float cantidadAnterior = materia.getCantidad() != null ? materia.getCantidad() : 0f;

                Lote nuevoLote = new Lote();
                nuevoLote.setIdLote(loteDTO.getIdLote());
                nuevoLote.setIdMateria(loteDTO.getIdMateria());
                nuevoLote.setCostoUnitario(loteDTO.getCostoUnitario());
                nuevoLote.setCantidad(loteDTO.getCantidad());
                nuevoLote.setCantidadDisponible(loteDTO.getCantidadDisponible());
                nuevoLote.setFechaIngreso(LocalDateTime.now());
                nuevoLote.setIdProveedor(loteDTO.getIdProveedor());
                nuevoLote.setIdOrden(idOrden);

                lotes.add(nuevoLote);

                // Guardar el lote individualmente para asegurar que esté persistido antes del movimiento
                loteRepository.save(nuevoLote);

                // Actualizar el inventario de la materia prima
                materiaPrimaService.recomputeMateriaTotalsAndCosto(loteDTO.getIdMateria());

                // Obtener la cantidad actualizada de la materia prima
                MateriaPrima updatedMateria = materiaPrimaRepository.findById(loteDTO.getIdMateria())
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + loteDTO.getIdMateria()));
                Float cantidadActual = updatedMateria.getCantidad() != null ? updatedMateria.getCantidad() : 0f;
                Float delta = cantidadActual - cantidadAnterior;

                // Registrar movimiento en la tabla Movimiento
                if (delta != 0f) {
                    Movimiento movimiento = new Movimiento();
                    movimiento.setMateriaPrima(updatedMateria);
                    movimiento.setCantidadAnterior(cantidadAnterior);
                    movimiento.setCantidadActual(cantidadActual);
                    movimiento.setCantidadCambio(Math.abs(delta));
                    movimiento.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
                    movimiento.setFechaMovimiento(LocalDateTime.now());
                    movimientoRepository.save(movimiento);
                }
            }
        } else {
            // Formato anterior: usar lotesIds (mantener para retrocompatibilidad)
            for (OrdenMateriaPrima ordenMP : orden.getOrdenMateriaPrimas()) {
                String idMateria = ordenMP.getMateriaPrima().getIdMateria();
                String idLote = ordenConfirmacion.getLotesIds().get(idMateria);

                if (idLote == null || idLote.trim().isEmpty()) {
                    throw new RuntimeException("Falta el ID de lote para la materia: " + ordenMP.getMateriaPrima().getNombre());
                }

                // Verificar que el ID de lote no exista ya
                if (loteRepository.existsById(idLote)) {
                    throw new RuntimeException("El ID de lote '" + idLote + "' ya existe");
                }

                // Obtener la materia prima para registrar el movimiento
                MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + idMateria));
                Float cantidadAnterior = materia.getCantidad() != null ? materia.getCantidad() : 0f;

                Lote nuevoLote = new Lote();
                nuevoLote.setIdLote(idLote);
                nuevoLote.setIdMateria(idMateria);
                nuevoLote.setCostoUnitario(ordenMP.getCostoUnitario());
                nuevoLote.setCantidad(ordenMP.getCantidad());
                nuevoLote.setCantidadDisponible(ordenMP.getCantidad());
                nuevoLote.setFechaIngreso(LocalDateTime.now());
                nuevoLote.setIdProveedor(orden.getProveedor().getIdProveedor());
                nuevoLote.setIdOrden(idOrden);

                lotes.add(nuevoLote);

                // Guardar el lote individualmente para asegurar que esté persistido antes del movimiento
                loteRepository.save(nuevoLote);

                // Actualizar el inventario de la materia prima
                materiaPrimaService.recomputeMateriaTotalsAndCosto(idMateria);

                // Obtener la cantidad actualizada de la materia prima
                MateriaPrima updatedMateria = materiaPrimaRepository.findById(idMateria)
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + idMateria));
                Float cantidadActual = updatedMateria.getCantidad() != null ? updatedMateria.getCantidad() : 0f;
                Float delta = cantidadActual - cantidadAnterior;

                // Registrar movimiento en la tabla Movimiento
                if (delta != 0f) {
                    Movimiento movimiento = new Movimiento();
                    movimiento.setMateriaPrima(updatedMateria);
                    movimiento.setCantidadAnterior(cantidadAnterior);
                    movimiento.setCantidadActual(cantidadActual);
                    movimiento.setCantidadCambio(Math.abs(delta));
                    movimiento.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
                    movimiento.setFechaMovimiento(LocalDateTime.now());
                    movimientoRepository.save(movimiento);
                }
            }
        }

        // Actualizar el total de la orden si se proporciona
        if (ordenConfirmacion.getTotalOrden() != null) {
            orden.setTotal(ordenConfirmacion.getTotalOrden());
        }

        // Marcar la orden como confirmada
        orden.setEstado(true);
        ordenRepository.save(orden);
    }

    public Long contarOrdenesPendientesPorProveedor(Long idProveedor) {
        if (idProveedor == null) {
            return 0L;
        }

        return ordenRepository.countOrdenesPendientesByProveedor(idProveedor);
    }
}