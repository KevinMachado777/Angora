package Angora.app.Controllers;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Services.LoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/lotes")
public class LoteController {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private LoteService loteService;

    // Metodo para obtener todos los lotes
    @GetMapping
    public ResponseEntity<?> getAll() {
        return new ResponseEntity<>(loteRepository.findAll(), HttpStatus.OK);
    }

    // Metodo para obtener un lote por id
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable(name = "id") String id) {
        return new ResponseEntity<>(loteService.findById(id), HttpStatus.OK);
    }

    // Metodo para obtener el ultimo lote de una materia en especifico
    @GetMapping("/ultimo/{idMateria}")
    public ResponseEntity<Lote> getUltimoLotePorMateria(@PathVariable String idMateria) {
        try {
            // Buscar el último lote de la materia prima ordenado por fecha de ingreso descendente
            Optional<Lote> ultimoLote = loteRepository.findFirstByIdMateriaOrderByFechaIngresoDesc(idMateria);

            if (ultimoLote.isPresent()) {
                return ResponseEntity.ok(ultimoLote.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Metodo para crear un lote
    @PostMapping
    public ResponseEntity<?> create(@RequestBody LoteDTO lote) {
        return new ResponseEntity<>(loteService.save(lote), HttpStatus.CREATED);
    }

    // Metodo para actualizar un lote
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable(name = "id") String id, @RequestBody LoteDTO loteDto) { // Modificado: Long a String
        if (!loteRepository.existsById(id)) {
            throw new RuntimeException("Lote no encontrado");
        }
        return new ResponseEntity<>(loteService.update(loteDto), HttpStatus.OK);
    }

    // Metodo para borrar un lote
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable(name = "id") String id) { // Modificado: Long a String
        if (!loteRepository.existsById(id)) {
            throw new RuntimeException("Lote no encontrado");
        }
        loteRepository.deleteById(id);
        return new ResponseEntity<>("Lote eliminado", HttpStatus.NO_CONTENT);
    }
}