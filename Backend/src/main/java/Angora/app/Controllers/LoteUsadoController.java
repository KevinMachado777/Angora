package Angora.app.Controllers;

import Angora.app.Entities.LoteUsado;
import Angora.app.Repositories.LoteUsadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Controlador para los lotes usados
@RestController
@RequestMapping("/lotes-usados")
public class LoteUsadoController {

    // Repositorio de lotes usados
    @Autowired
    private LoteUsadoRepository loteUsadoRepository;

    // Obtener los lotes usados
    @GetMapping
    public ResponseEntity<?> getAll() {
        return new ResponseEntity<>(loteUsadoRepository.findAll(), HttpStatus.OK);
    }

    // Obtener un lote usado por su ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return new ResponseEntity<>(loteUsadoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build()), HttpStatus.OK);
    }

    // Guardar un lote usado
    @PostMapping
    public ResponseEntity<?> create(@RequestBody LoteUsado loteUsado) {
        return new ResponseEntity<>(loteUsadoRepository.save(loteUsado), HttpStatus.CREATED);
    }

    // Actualizar un lote usado
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LoteUsado loteUsado) {

        if (!loteUsadoRepository.existsById(id)) {
            throw new RuntimeException("Lote usado no encontrado");
        }

        return new ResponseEntity<>(loteUsadoRepository.save(loteUsado), HttpStatus.OK);
    }

    // Eliminar un lote usado
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!loteUsadoRepository.existsById(id)) {
            throw new RuntimeException("Lote usado no encontrado");
        }

        loteUsadoRepository.deleteById(id);

        return new ResponseEntity<>("Lote usado eliminado", HttpStatus.NO_CONTENT);
    }
}
