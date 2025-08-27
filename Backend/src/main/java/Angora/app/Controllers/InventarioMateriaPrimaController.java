package Angora.app.Controllers;

import Angora.app.Controllers.dto.MateriaDTO;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Services.MateriaPrimaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Controlador de materia prima
@RestController
@RequestMapping("/inventarioMateria")
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
    public ResponseEntity<?> getById(@PathVariable(name = "id") Long id){
        return new ResponseEntity<>(materiaPrimaService.findById(id), HttpStatus.OK);
    }

    // Guardar una materia prima
    // ¡IMPORTANTE crear otro metodo en el servicio si es para orden y otro metodo en el controlador!
    // Este metodo es exclusivo para guardar si la materia no tiene proveedor
    @PostMapping
    public ResponseEntity<?> create(@RequestBody MateriaDTO materia){
        System.out.println("Materia a guardar: " + materia);
        return new ResponseEntity<>(materiaPrimaService.save(materia), HttpStatus.CREATED);
    }

    // Actualizar una materia
    @PutMapping
    public ResponseEntity<?> update(@RequestBody MateriaDTO materia){
        System.out.println("Materia a modificar: " + materia);
        return new ResponseEntity<>(materiaPrimaService.update(materia), HttpStatus.OK);
    }
}