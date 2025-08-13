package Angora.app.Controllers;

import Angora.app.Controllers.dto.LoteDTO;
import Angora.app.Entities.Lote;
import Angora.app.Repositories.LoteRepository;
import Angora.app.Services.LoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Controlador de los lotes
@RestController
@RequestMapping("/lotes")
public class LoteController {

    @Autowired
    private LoteService loteService;

    @Autowired
    private LoteRepository loteRepository;

    // Obtener todos los lotes
    @GetMapping
    public ResponseEntity<?> getAll() {
        return new ResponseEntity<>(loteService.findAll(), HttpStatus.OK);
    }

    // Obtener un lote por su ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return new ResponseEntity<>(loteService.findById(id), HttpStatus.OK);
    }

    // Guardar un lote (puede usarse para confirmar orden de compra)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody LoteDTO lote) {
        return new ResponseEntity<>(loteService.save(lote), HttpStatus.CREATED);
    }

    // Actualizar algun lote
    @PutMapping
    public ResponseEntity<?> update(@RequestBody Lote lote){
        if(!loteRepository.existsById(lote.getIdLote())){
            throw new RuntimeException("Lote no encontrado");
        }
        return new ResponseEntity<>(loteService.update(lote), HttpStatus.OK);
    }
}