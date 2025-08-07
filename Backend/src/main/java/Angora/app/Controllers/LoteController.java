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

    // Repositorio
    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private LoteService loteService;

    // Obtener todos los lotes
    @GetMapping
    public ResponseEntity<?> getAll(){

        return new ResponseEntity<>(loteRepository.findAll(), HttpStatus.OK);
    }

    // Obtener un lote por su ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id){

        return new ResponseEntity<>(loteService.findById(id), HttpStatus.OK);
    }

    // Guardar un lote
    // NOTA: Este método se puede usar para guardar la confirmacion de la orden de compra de los proveedores
    @PostMapping
    public ResponseEntity<?> create(@RequestBody LoteDTO lote){
        return new ResponseEntity<>(loteService.save(lote), HttpStatus.CREATED);
    }

    // Actualizar algun lote
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Lote lote){

        if(!loteRepository.existsById(id)){
            throw new RuntimeException("Lote no encontrado");
        }

        lote.setIdLote(id);

        return new ResponseEntity<>(loteRepository.save(lote), HttpStatus.OK);
    }

    // Eliminar un lote
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id){

        if(!loteRepository.existsById(id)){
            throw new RuntimeException("Lote no encontrado");
        }

        loteRepository.deleteById(id);

        return new ResponseEntity<>("Lote eliminado", HttpStatus.NO_CONTENT);
    }


}
