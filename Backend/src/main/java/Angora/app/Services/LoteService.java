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

    @Autowired
    private MateriaPrimaService materiaPrimaService; // Inyectamos MateriaPrimaService

    public List<Lote> findAll() {
        return loteRepository.findAll();
    }

    // Busca un lote por su ID
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

    // Método para guardar un lote (entrada)
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
        loteEntity.setIdOrden(loteDto.getIdOrden());
        Lote savedLote = loteRepository.save(loteEntity);

        // Delegar la actualización de la materia a MateriaPrimaService
        materiaPrimaService.recomputeMateriaTotalsAndCosto(loteDto.getIdMateria());

        // Registrar movimiento
        MateriaPrima updatedMateria = materiaPrimaRepository.findById(loteDto.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
        Float delta = (updatedMateria.getCantidad() != null ? updatedMateria.getCantidad() : 0f) - anterior;
        if (delta != null && delta != 0f) {
            Movimiento mov = new Movimiento();
            mov.setMateriaPrima(updatedMateria);
            mov.setCantidadAnterior(anterior);
            mov.setCantidadCambio(Math.abs(delta));
            mov.setTipoMovimiento(delta > 0 ? "entrada" : "salida");
            mov.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(mov);
        }

        // Preparar DTO de salida
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

        // Recalcular total disponible y actualizar materia
        materiaPrimaService.recomputeMateriaTotalsAndCosto(loteDto.getIdMateria());

        // Registrar movimiento
        MateriaPrima updatedMateria = materiaPrimaRepository.findById(loteDto.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
        Float delta = (updatedMateria.getCantidad() != null ? updatedMateria.getCantidad() : 0f) - anterior;
        if (delta != null && delta != 0f) {
            Movimiento mov = new Movimiento();
            mov.setMateriaPrima(updatedMateria);
            mov.setCantidadAnterior(anterior);
            mov.setCantidadActual(updatedMateria.getCantidad());
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
}