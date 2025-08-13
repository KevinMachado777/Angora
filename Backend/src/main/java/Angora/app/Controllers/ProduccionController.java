package Angora.app.Controllers;

import Angora.app.Entities.Produccion;
import Angora.app.Repositories.ProduccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Controlador de las producciones
@RestController
@RequestMapping("/producciones")
public class ProduccionController {

    @Autowired
    private ProduccionRepository produccionRepository;

    // Obtener todas las producciones
    @GetMapping
    public ResponseEntity<?> getAll() {
        return new ResponseEntity<>(produccionRepository.findAll(), HttpStatus.OK);
    }

    // Obtener alguna producción por su ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return new ResponseEntity<>(produccionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build()), HttpStatus.OK);
    }

    // Método para guardar una producción
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Produccion produccion) {
        return new ResponseEntity<>(produccionRepository.save(produccion), HttpStatus.CREATED);
    }

    // Actualizar alguna produccion
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produccion produccion) {
        if (!produccionRepository.existsById(id)) {
            return new ResponseEntity<>("Producción no encontrada", HttpStatus.NOT_FOUND);
        }
        produccion.setIdProduccion(id);
        return new ResponseEntity<>(produccionRepository.save(produccion), HttpStatus.OK);
    }

    // Eliminar alguna producción
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        produccionRepository.deleteById(id);
        return new ResponseEntity<>("Producción eliminada", HttpStatus.NO_CONTENT);
    }
}