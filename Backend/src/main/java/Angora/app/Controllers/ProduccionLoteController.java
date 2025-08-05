package Angora.app.Controllers;

import Angora.app.Entities.ProduccionLote;
import Angora.app.Repositories.ProduccionLoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Controlador de producciones asociadas a los lotes
@RestController
@RequestMapping("/producciones-lotes")
public class ProduccionLoteController {

    // Repositorio
    @Autowired
    private ProduccionLoteRepository produccionLoteRepository;

    // Obtener all
    @GetMapping
    public ResponseEntity<?> getAll(){

        return ResponseEntity.ok(produccionLoteRepository.findAll());
    }

    // Obtener by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id){

        return new ResponseEntity<>( produccionLoteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build()), HttpStatus.OK) ;
    }

    // Crear
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProduccionLote produccionLote){
        return new ResponseEntity<>(produccionLoteRepository.save(produccionLote), HttpStatus.CREATED);
    }

    // Actualizar
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProduccionLote produccionLote){
        if(!produccionLoteRepository.existsById(id)){
            return new ResponseEntity<>("ProduccionLote no encontrado", HttpStatus.NOT_FOUND);
        }

        produccionLote.setIdProduccion(id);
        return new ResponseEntity<>(produccionLoteRepository.save(produccionLote), HttpStatus.OK);
    }

    // Eliminar
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        produccionLoteRepository.deleteById(id);
        return new ResponseEntity<>("ProduccionLote eliminada", HttpStatus.NO_CONTENT);
    }




}
