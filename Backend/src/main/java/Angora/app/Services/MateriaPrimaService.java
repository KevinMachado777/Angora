package Angora.app.Services;

import Angora.app.Controllers.dto.MateriaDTO;
import Angora.app.Entities.Lote;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Repositories.MateriaPrimaRepository;
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
        if (!materiaPrimaRepository.existsById(materia.getIdMateria())) {
            throw new RuntimeException("Materia prima no encontrada");
        }

        MateriaPrima materiaUpdate = new MateriaPrima();
        materiaUpdate.setIdMateria(materia.getIdMateria());
        materiaUpdate.setNombre(materia.getNombre());
        materiaUpdate.setCantidad(materia.getCantidad());
        materiaUpdate.setCosto(materia.getCosto());
        materiaUpdate.setVenta(materia.getVenta());

        materiaPrimaRepository.save(materiaUpdate);
        return materia;
    }
}