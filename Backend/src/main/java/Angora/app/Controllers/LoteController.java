package Angora.app.Controllers;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Services.LoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lotes")
public class LoteController {

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private LoteService loteService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return new ResponseEntity<>(loteRepository.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return new ResponseEntity<>(loteService.findById(id), HttpStatus.OK);
    }

    @GetMapping("/ultimo/{idMateria}")
    public ResponseEntity<LoteDTO> getUltimoLotePorMateria(@PathVariable Long idMateria) {
        LoteDTO lote = loteService.findUltimoLotePorMateria(idMateria);
        if (lote == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(lote);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LoteDTO lote) {
        return new ResponseEntity<>(loteService.save(lote), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LoteDTO loteDto) {
        if (!loteRepository.existsById(id)) {
            throw new RuntimeException("Lote no encontrado");
        }
        return new ResponseEntity<>(loteService.update(loteDto), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!loteRepository.existsById(id)) {
            throw new RuntimeException("Lote no encontrado");
        }
        loteRepository.deleteById(id);
        return new ResponseEntity<>("Lote eliminado", HttpStatus.NO_CONTENT);
    }
}