package Angora.app.Services;

import Angora.app.Controllers.dto.MateriaDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.MovimientoRepository;
import Angora.app.Services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MateriaPrimaService {

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private MovimientoRepository movimientoRepository;

    // Metodo para obtener todas las materias
    public List<MateriaDTO> findAll() {
        List<MateriaPrima> materiasEntity = materiaPrimaRepository.findAll();
        List<MateriaDTO> materiasDto = new ArrayList<>();
        materiasEntity.forEach(materia -> {
            MateriaDTO materiaDto = new MateriaDTO();
            materiaDto.setIdMateria(materia.getIdMateria());
            materiaDto.setNombre(materia.getNombre());
            materiaDto.setCantidad(materia.getCantidad());
            materiaDto.setCosto(materia.getCosto());
            materiaDto.setVenta(materia.getVenta());
            materiasDto.add(materiaDto);
        });
        return materiasDto;
    }

    // Metodo para buscar una materia por ID
    public MateriaDTO findById(Long id) {
        MateriaPrima materiaPrima = materiaPrimaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
        MateriaDTO materiaDto = new MateriaDTO();
        materiaDto.setIdMateria(materiaPrima.getIdMateria());
        materiaDto.setNombre(materiaPrima.getNombre());
        materiaDto.setCantidad(materiaPrima.getCantidad());
        materiaDto.setCosto(materiaPrima.getCosto());
        materiaDto.setVenta(materiaPrima.getVenta());
        return materiaDto;
    }

    // Metodo para guardar una materia
    @Transactional
    public MateriaDTO save(MateriaDTO materiaDto) {
        MateriaPrima materiaPrima = new MateriaPrima();
        materiaPrima.setNombre(materiaDto.getNombre());
        materiaPrima.setCantidad(0f);
        materiaPrima.setCosto(0);
        materiaPrima.setVenta(materiaDto.getVenta());

        MateriaPrima savedMateria = materiaPrimaRepository.save(materiaPrima);
        materiaDto.setIdMateria(savedMateria.getIdMateria());
        recomputeMateriaTotalsAndCosto(savedMateria.getIdMateria());
        return materiaDto;
    }

    // Metodo para actualizar una materia
    @Transactional
    public MateriaDTO update(MateriaDTO materia) {
        MateriaPrima existing = materiaPrimaRepository.findById(materia.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float previo = existing.getCantidad();
        existing.setNombre(materia.getNombre());
        existing.setVenta(materia.getVenta());
        recomputeMateriaTotalsAndCosto(existing.getIdMateria());
        existing = materiaPrimaRepository.findById(existing.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada después de recálculo"));

        MateriaPrima guardar = materiaPrimaRepository.save(existing);
        productoService.recalculateProductsCostByMateria(guardar);

        Float actual = guardar.getCantidad() != null ? guardar.getCantidad() : 0f;
        if (previo == null) previo = 0f;
        if (!previo.equals(actual)) {
            Movimiento movimiento = new Movimiento();
            movimiento.setMateriaPrima(guardar);
            movimiento.setCantidadAnterior(previo);
            movimiento.setCantidadCambio(Math.abs(actual - previo));
            movimiento.setTipoMovimiento(actual > previo ? "entrada" : "salida");
            movimiento.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(movimiento);
        }

        MateriaDTO dto = new MateriaDTO();
        dto.setIdMateria(guardar.getIdMateria());
        dto.setNombre(guardar.getNombre());
        dto.setCantidad(guardar.getCantidad());
        dto.setCosto(guardar.getCosto());
        dto.setVenta(guardar.getVenta());
        return dto;
    }

    // Metodo para volver a calcular el costo de una materia segun los lotes
    @Transactional
    public void recomputeMateriaTotalsAndCosto(Long idMateria) {
        MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        List<Lote> allLotes = loteRepository.findByIdMateria(idMateria);

        float totalDisponible = 0f;
        float weightedCostNumerator = 0f;
        float totalCantidadOriginal = 0f; // Para el cálculo del costo promedio

        for (Lote l : allLotes) {
            float availableQuantity = l.getCantidadDisponible() != null ? l.getCantidadDisponible() : 0f;
            float originalQuantity = l.getCantidad() != null ? l.getCantidad() : 0f;
            float unitCost = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0f;

            // Solo suma la cantidad disponible para el total
            totalDisponible += availableQuantity;

            // Para el costo, usa la cantidad original de cada lote (no la disponible)
            // Esto asegura que el costo promedio considere todos los lotes, incluso los agotados
            totalCantidadOriginal += originalQuantity;
            weightedCostNumerator += unitCost * originalQuantity;
        }

        materia.setCantidad(totalDisponible);

        // Calcula el costo promedio basado en las cantidades originales de todos los lotes
        int costoPromedio = totalCantidadOriginal > 0 ? Math.round(weightedCostNumerator / totalCantidadOriginal) : 0;

        // Redondeo al múltiplo de 50 más cercano
        costoPromedio = ((costoPromedio + 25) / 50) * 50;
        materia.setCosto(costoPromedio);

        materiaPrimaRepository.save(materia);
    }
}