package Angora.app.Controllers;

import Angora.app.Controllers.dto.MateriaDTO;
import Angora.app.Entities.MateriaPrima;
import Angora.app.Services.MateriaPrimaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventarioMateria")
public class InventarioMateriaPrimaController {

    @Autowired
    private MateriaPrimaService materiaPrimaService;

    // Metodo que obtiene todas las materias
    @GetMapping
    public ResponseEntity<?> getAll(){
        return new ResponseEntity<>(materiaPrimaService.findAll(), HttpStatus.OK);
    }

    // Metodo para buscar una materia por id
    @GetMapping("/{id}")

    public ResponseEntity<?> getById(@PathVariable String id){ // Modificado: Long a String
        return new ResponseEntity<>(materiaPrimaService.findById(id), HttpStatus.OK);
    }

    // Metodo para crear una materia
    @PostMapping
    public ResponseEntity<?> create(@RequestBody MateriaDTO materia){
        System.out.println("Materia a guardar: " + materia);
        return new ResponseEntity<>(materiaPrimaService.save(materia), HttpStatus.CREATED);
    }

    // Metodo para actualizar una materia
    @PutMapping
    public ResponseEntity<?> update(@RequestBody MateriaDTO materia){
        System.out.println("Materia a modificar: " + materia);
        return new ResponseEntity<>(materiaPrimaService.update(materia), HttpStatus.OK);
    }
}