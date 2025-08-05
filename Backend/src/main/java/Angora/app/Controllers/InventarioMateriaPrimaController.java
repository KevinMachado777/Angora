package Angora.app.Controllers;

import Angora.app.Entities.MateriaPrima;
import Angora.app.Services.MateriaPrimaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Controlador de materia prima
@RestController
@RequestMapping("/inventarioPrima")
public class InventarioMateriaPrimaController {

    // Servicio de inventario de materia prima
    @Autowired
    private MateriaPrimaService materiaPrimaService;

    // Obtener todas las materias primas del inventario
    @GetMapping
    public ResponseEntity<?> getAll(){
        return new ResponseEntity<>(materiaPrimaService.findAll(), HttpStatus.OK);
    }

    // Obtener una materia por ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id){
        return new ResponseEntity<>(materiaPrimaService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build()), HttpStatus.OK);
    }

    // Guardar una materia prima
    // ¡IMPORTANTE! crear otro método en el servicio si es para orden y otro metodo en el controlador!
    // Este método es exclusivo para guardar si la materia no tiene proveedor
    @PostMapping
    public ResponseEntity<?> create(@RequestBody MateriaPrima materia){

        return new ResponseEntity<>(materiaPrimaService.save(materia), HttpStatus.CREATED);
    }

    // Actualizar una materia
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody MateriaPrima materia){
        return new ResponseEntity<>(materiaPrimaService.update(id, materia), HttpStatus.OK);
    }

    // Eliminar una materia
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        materiaPrimaService.delete(id);
        return new ResponseEntity<>("Materia prima eliminada", HttpStatus.NO_CONTENT);
    }

}
