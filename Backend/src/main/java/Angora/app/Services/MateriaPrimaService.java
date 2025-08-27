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

    // Obtener todas las materias primas
    public List<MateriaDTO> findAll() {
        List<MateriaPrima> materiasEntity = materiaPrimaRepository.findAll();
        List<MateriaDTO> materiasDto = new ArrayList<>();
        materiasEntity.forEach(materia -> {
            MateriaDTO materiaDto = new MateriaDTO();
            materiaDto.setIdMateria(materia.getIdMateria());
            materiaDto.setNombre(materia.getNombre());
            materiaDto.setCantidad(materia.getCantidad());
            materiaDto.setCosto(materia.getCosto());
            materiaDto.setVenta(materia.getVenta()); // Nullable, mantenido para compatibilidad
            materiasDto.add(materiaDto);
        });
        return materiasDto;
    }

    // Buscar materia prima por ID
    public MateriaDTO findById(String id) {
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

    // Guardar una nueva materia prima
    @Transactional
    public MateriaDTO save(MateriaDTO materiaDto) {
        // Validar ID único
        if (materiaPrimaRepository.findById(materiaDto.getIdMateria()).isPresent()) {
            throw new RuntimeException("El ID de la materia prima ya existe");
        }
        if (materiaPrimaRepository.findByNombre(materiaDto.getNombre()).isPresent()) {
            throw new RuntimeException("El nombre de la materia prima ya existe");
        }

        MateriaPrima materiaPrima = new MateriaPrima();
        materiaPrima.setIdMateria(materiaDto.getIdMateria());
        materiaPrima.setNombre(materiaDto.getNombre());
        materiaPrima.setCantidad(0f);
        materiaPrima.setCosto(0);

        MateriaPrima savedMateria = materiaPrimaRepository.save(materiaPrima);
        recomputeMateriaTotalsAndCosto(savedMateria.getIdMateria());
        materiaDto.setIdMateria(savedMateria.getIdMateria());
        return materiaDto;
    }

    // Actualizar una materia prima existente
    @Transactional
    public MateriaDTO update(MateriaDTO materia) {
        MateriaPrima existing = materiaPrimaRepository.findById(materia.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float previo = existing.getCantidad();
        existing.setNombre(materia.getNombre());
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

    // Recalcular totales y costo promedio de una materia prima
    @Transactional
    public void recomputeMateriaTotalsAndCosto(String idMateria) {
        MateriaPrima materia = materiaPrimaRepository.findById(idMateria)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        List<Lote> allLotes = loteRepository.findByIdMateria(idMateria);

        float totalDisponible = 0f;
        float sumaCostosUnitarios = 0f;
        int cantidadLotes = 0;

        for (Lote l : allLotes) {
            float availableQuantity = l.getCantidadDisponible() != null ? l.getCantidadDisponible() : 0f;
            float unitCost = l.getCostoUnitario() != null ? l.getCostoUnitario() : 0f;

            totalDisponible += availableQuantity;
            sumaCostosUnitarios += unitCost;
            cantidadLotes++;
        }

        materia.setCantidad(totalDisponible);

        // Calcular costo promedio aritmético simple, evitar división por cero
        int costoPromedio = cantidadLotes > 0 ? Math.round(sumaCostosUnitarios / cantidadLotes) : 0;

        // Redondeo al múltiplo de 50 más cercano
        costoPromedio = ((costoPromedio + 25) / 50) * 50;
        materia.setCosto(costoPromedio);

        materiaPrimaRepository.save(materia);
    }
}