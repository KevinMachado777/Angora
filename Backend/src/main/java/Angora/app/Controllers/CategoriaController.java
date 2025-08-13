package Angora.app.Controllers;

import Angora.app.Entities.Categoria;
import Angora.app.Entities.Producto;
import Angora.app.Repositories.CategoriaRepository;
import Angora.app.Repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public ResponseEntity<List<Categoria>> getAll() {
        return new ResponseEntity<>(categoriaRepository.findAll(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Categoria> create(@RequestBody Categoria categoria) {
        if (categoriaRepository.existsByNombre(categoria.getNombre())) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST); // Ya existe
        }
        return new ResponseEntity<>(categoriaRepository.save(categoria), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categoria> update(@PathVariable Long id, @RequestBody Categoria categoria) {
        Optional<Categoria> existing = categoriaRepository.findById(id);
        if (existing.isPresent()) {
            Categoria updated = existing.get();
            updated.setNombre(categoria.getNombre());
            return new ResponseEntity<>(categoriaRepository.save(updated), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<Categoria> categoria = categoriaRepository.findById(id);
        if (categoria.isPresent()) {
            // Actualizar productos asociados a idCategoria = null
            List<Producto> productosAsociados = productoRepository.findByIdCategoriaIdCategoria(id);
            for (Producto p : productosAsociados) {
                p.setIdCategoria(null);
                productoRepository.save(p);
            }
            categoriaRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}