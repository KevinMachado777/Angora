package Angora.app.Services;

import Angora.app.Controllers.dto.MateriaDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Entities.Movimiento;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
import Angora.app.Repositories.MovimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// Servicio de materia prima
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

    // Listar las materias
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

    // Buscar materias por id
    public MateriaDTO findById(Long id) {
        MateriaPrima materiaPrima = materiaPrimaRepository.findById(id).orElseThrow(() -> {
            throw new RuntimeException("Materia prima no encontrada");
        });

        MateriaDTO materiaDto = new MateriaDTO();
        materiaDto.setIdMateria(materiaPrima.getIdMateria());
        materiaDto.setNombre(materiaPrima.getNombre());
        materiaDto.setCantidad(materiaPrima.getCantidad());
        materiaDto.setCosto(materiaPrima.getCosto());
        materiaDto.setVenta(materiaPrima.getVenta());
        return materiaDto;
    }

    // Guardar una materia prima
    @Transactional
    public MateriaDTO save(MateriaDTO materiaDto) {

        MateriaPrima materiaPrima = new MateriaPrima();
        materiaPrima.setNombre(materiaDto.getNombre());
        materiaPrima.setCantidad(0f);
        materiaPrima.setCosto(0);
        materiaPrima.setVenta(materiaDto.getVenta());

        MateriaPrima savedMateria = materiaPrimaRepository.save(materiaPrima);
        materiaDto.setIdMateria(savedMateria.getIdMateria());
        return materiaDto;
    }

    // Actualizar una materia prima
    @Transactional
    public MateriaDTO update(MateriaDTO materia) {
        MateriaPrima existing = materiaPrimaRepository.findById(materia.getIdMateria())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));

        Float previo = existing.getCantidad();
        existing.setNombre(materia.getNombre());
        existing.setCantidad(materia.getCantidad());
        existing.setCosto(materia.getCosto());
        existing.setVenta(materia.getVenta());

        MateriaPrima guardar = materiaPrimaRepository.save(existing);

        // Recalcular el precio de los productos que tiene asociada es materia
        productoService.recalculateProductsCostByMateria(guardar.getIdMateria());

        // registrar movimiento si la cantidad cambió
        if (previo == null) previo = 0f;
        Float actual = existing.getCantidad() != null ? existing.getCantidad() : 0f;
        if (!previo.equals(actual)) {
            Movimiento movimiento = new Movimiento();
            movimiento.setMateriaPrima(existing);
            movimiento.setCantidadAnterior(previo);
            movimiento.setCantidadCambio(Math.abs(actual - previo));
            movimiento.setTipoMovimiento(actual > previo ? "entrada" : "salida");
            movimiento.setFechaMovimiento(LocalDateTime.now());
            movimientoRepository.save(movimiento);
        }

        // construir y devolver DTO (según tu DTO)
        MateriaDTO dto = new MateriaDTO();
        dto.setIdMateria(existing.getIdMateria());
        dto.setNombre(existing.getNombre());
        dto.setCantidad(existing.getCantidad());
        dto.setCosto(existing.getCosto());
        dto.setVenta(existing.getVenta());
        return dto;
    }
}