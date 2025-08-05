package Angora.app.Controllers;

import Angora.app.Controllers.dto.ProductoDTO;
import Angora.app.Entities.Producto;
import Angora.app.Services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Controlador del inventario de productos
@RestController
@RequestMapping("/inventarioProducto")
public class InventarioProductoController {

    // Servicio de producto
    @Autowired
    private ProductoService productoService;

    // Obtener todos los productos del inventario
    @GetMapping
    public ResponseEntity<?> getAll(){
        var productos = productoService.findAll();
        System.out.println("Productos encontrados: " + productos.toString() + "");
        return new ResponseEntity<>(productos, HttpStatus.OK);
    }

    // Endpoint para listar en ventas
    @GetMapping("/listado")
    public List<Producto> listarProductos(){
        var productos = productoService.listarProductos();
        return productos;
    }

    @PutMapping("/{cantidadComprada}")
    public void actualizarStock(@RequestBody Producto producto, @PathVariable int cantidadComprada){
        productoService.disminuirStock(producto, cantidadComprada);
    }

    // Obtener producto por un ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id){
        var productoDto = productoService.findById(id);
        return new ResponseEntity<>(productoDto, HttpStatus.OK);
    }

    // Guardar un producto
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> create(@RequestBody ProductoDTO producto){

        System.out.println("Producto a guardar: " + producto.toString( ));
        return new ResponseEntity<>(productoService.crearProductoDesdeDTO(producto), HttpStatus.CREATED);
    }

     // Actualizar un producto
    @PutMapping(consumes = "application/json")
    public ResponseEntity<?> update(@RequestBody ProductoDTO producto){

        return new ResponseEntity<>(productoService.actualizarProductoDesdeDTO(producto), HttpStatus.OK);
    }

    // Eliminar un producto
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id){

        productoService.delete(id);

        return new ResponseEntity<>("Producto Eliminado", HttpStatus.NO_CONTENT);
    }

    // Actualizar el stock de un producto, aumentar o reducir el stock
    /*@PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody Integer nuevaCantidad){
        Producto producto = productoService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto con ID " + id + " no encontrado."));

        if (producto == null) {
            return new ResponseEntity<>("Producto no encontrado: " + id, HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(productoService.updateStock(id, nuevaCantidad), HttpStatus.OK);
    }*/
}