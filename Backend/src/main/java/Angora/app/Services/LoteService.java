package Angora.app.Services;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.MovimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LoteService {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private MovimientoRepository movimientoRepository;
    public List<Lote> findAll() {
        return loteRepository.findAll();
    }

    // Busca un lote por sy ID
    public LoteDTO findById(Long id) {
        Lote loteEntity = loteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));
        LoteDTO loteDto = new LoteDTO();
        loteDto.setIdLote(id);
        loteDto.setIdMateria(loteEntity.getIdMateria());
        loteDto.setCostoUnitario(loteEntity.getCostoUnitario());
        loteDto.setCantidad(loteEntity.getCantidad());
        loteDto.setCantidadDisponible(loteEntity.getCantidadDisponible());
        loteDto.setFechaIngreso(loteEntity.getFechaIngreso());
        loteDto.setIdProveedor(loteEntity.getIdProveedor());
        return loteDto;
    }

    // Metodo para guardar un lote (entrada)
    public LoteDTO findUltimoLotePorMateria(Long idMateria) {
        Optional<Lote> loteOptional = loteRepository.findTopByIdMateriaOrderByFechaIngresoDescIdLoteDesc(idMateria);
        if (loteOptional.isEmpty()) {
            return null;
        }
        Lote loteEntity = loteOptional.get();
        LoteDTO loteDto = new LoteDTO();
        loteDto.setIdLote(loteEntity.getIdLote());
        loteDto.setIdMateria(loteEntity.getIdMateria());
        loteDto.setCostoUnitario(loteEntity.getCostoUnitario());
        loteDto.setCantidad(loteEntity.getCantidad());
        loteDto.setCantidadDisponible(loteEntity.getCantidadDisponible());
        loteDto.setFechaIngreso(loteEntity.getFechaIngreso());
        loteDto.setIdProveedor(loteEntity.getIdProveedor());
        return loteDto;
    }

    @Transactional
    public LoteDTO save(LoteDTO loteDto) {
        MateriaPrima materia = materiaPrimaRepository.findById(loteDto.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float anterior = materia.getCantidad() != null ? materia.getCantidad() : 0f;

        Lote loteEntity = new Lote();
        loteEntity.setIdMateria(loteDto.getIdMateria());
        loteEntity.setCostoUnitario(loteDto.getCostoUnitario());
        loteEntity.setCantidad(loteDto.getCantidad());
        loteEntity.setCantidadDisponible(loteDto.getCantidad());
        loteEntity.setFechaIngreso(LocalDateTime.now());
        loteEntity.setIdProveedor(loteDto.getIdProveedor());
        // Guardar referencia a la orden en caso de que venga
        loteEntity.setIdOrden(loteDto.getIdOrden());
        Lote savedLote = loteRepository.save(loteEntity);

        // recalcular total disponible y actualizar materia
        Float totalDisponible = loteRepository.sumCantidadDisponibleByIdMateria(loteDto.getIdMateria());
        materia.setCantidad(totalDisponible != null ? totalDisponible : 0f);
        materiaPrimaRepository.save(materia);

        // registrar movimiento (entrada si delta > 0)
        Float delta = (materia.getCantidad() != null ? materia.getCantidad() : 0f) - anterior;
        if (delta != null && delta != 0f) {
            Movimiento mov = new Movimiento();
            mov.setMateriaPrima(materia);
            mov.setCantidadAnterior(anterior);
            mov.setCantidadActual(materia.getCantidad());
            mov.setCantidadCambio(delta);
            mov.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
            mov.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(mov);
        }

        // preparar DTO de salida
        LoteDTO dto = new LoteDTO();
        dto.setIdLote(savedLote.getIdLote());
        dto.setIdMateria(savedLote.getIdMateria());
        dto.setCostoUnitario(savedLote.getCostoUnitario());
        dto.setCantidad(savedLote.getCantidad());
        dto.setCantidadDisponible(savedLote.getCantidadDisponible());
        dto.setFechaIngreso(savedLote.getFechaIngreso());
        dto.setIdProveedor(savedLote.getIdProveedor());
        dto.setIdOrden(savedLote.getIdOrden());
        return dto;
    }

    @Transactional
    public LoteDTO update(LoteDTO loteDto) {
        Lote existing = loteRepository.findById(loteDto.getIdLote())
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));
        MateriaPrima materia = materiaPrimaRepository.findById(loteDto.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float anterior = materia.getCantidad() != null ? materia.getCantidad() : 0f;

        existing.setCostoUnitario(loteDto.getCostoUnitario());
        existing.setCantidadDisponible(loteDto.getCantidadDisponible());
        // No permitir modificar cantidad inicial ni fechaIngreso para consistencia
        Lote saved = loteRepository.save(existing);

        Float totalDisponible = loteRepository.sumCantidadDisponibleByIdMateria(loteDto.getIdMateria());
        materia.setCantidad(totalDisponible != null ? totalDisponible : 0f);
        materiaPrimaRepository.save(materia);

        Float delta = (materia.getCantidad() != null ? materia.getCantidad() : 0f) - anterior;
        if (delta != null && delta != 0f) {
            Movimiento mov = new Movimiento();
            mov.setMateriaPrima(materia);
            mov.setCantidadAnterior(anterior);
            mov.setCantidadActual(materia.getCantidad());
            mov.setCantidadCambio(delta);
            mov.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
            mov.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(mov);
        }

        LoteDTO dto = new LoteDTO();
        dto.setIdLote(saved.getIdLote());
        dto.setIdMateria(saved.getIdMateria());
        dto.setCostoUnitario(saved.getCostoUnitario());
        dto.setCantidad(saved.getCantidad());
        dto.setCantidadDisponible(saved.getCantidadDisponible());
        dto.setFechaIngreso(saved.getFechaIngreso());
        dto.setIdProveedor(saved.getIdProveedor());
        return dto;
    }

    // recalcula cantidad total y costo promedio basado en cantidadDisponible de lotes
    @Transactional
    private void recomputeMateriaTotalsAndCosto(Long idMateria) {
        MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        // obtener lotes con cantidadDisponible > 0 (usa el query que ya tienes)
        List<Lote> lotes = loteRepository.findByIdMateriaAndCantidadDisponibleGreaterThan(idMateria, 0f);

        float totalDisponible = 0f;
        float numer = 0f;
        for (Lote l : lotes) {
            float q = l.getCantidadDisponible() != null ? l.getCantidadDisponible() : 0f;
            float c = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0f;
            totalDisponible += q;
            numer += c * q;
        }

        materia.setCantidad(totalDisponible);
        // MateriaPrima.costo es Integer en tu entidad: redondeamos al múltiplo de 50 más cercano
        int costoPromedio = totalDisponible > 0 ? Math.round(numer / totalDisponible) : 0;
        costoPromedio = ((costoPromedio + 25) / 50) * 50; // Redondeo al múltiplo de 50
        materia.setCosto(costoPromedio);

        materiaPrimaRepository.save(materia);
    }
}
