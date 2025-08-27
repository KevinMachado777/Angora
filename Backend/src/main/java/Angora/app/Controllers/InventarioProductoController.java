package Angora.app.Controllers;

import Angora.app.Controllers.dto.NuevaCantidadDTO;
import Angora.app.Controllers.dto.ProductoDTO;
import Angora.app.Entities.Producto;
import Angora.app.Services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Controlador del inventario de productos
@RestController
@RequestMapping("/inventarioProducto")
public class InventarioProductoController {

    @Autowired
    private ProductoService productoService;

    // Obtener todos los productos del inventario
    @GetMapping
    public ResponseEntity<?> getAll() {
        var productos = productoService.findAll();
        System.out.println("Productos encontrados: " + productos.toString());
        return new ResponseEntity<>(productos, HttpStatus.OK);
    }

    // Endpoint para listar en ventas
    @GetMapping("/listado")
    public List<Producto> listarProductos() {
        var productos = productoService.listarProductos();
        return productos;
    }

    // Obtener producto por un ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            var productoDto = productoService.findById(id);
            return new ResponseEntity<>(productoDto, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    // Guardar un producto
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> create(@RequestBody ProductoDTO producto) {
        try {
            return new ResponseEntity<>(productoService.crearProductoDesdeDTO(producto), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Actualizar un producto
    @PutMapping(value = "/{id}", consumes = "application/json")
    public ResponseEntity<?> update(@PathVariable(name = "id") String id, @RequestBody ProductoDTO producto) {
        try {
            if (!id.equals(producto.getIdProducto())) {
                return new ResponseEntity<>("El ID del cuerpo no coincide con el ID de la ruta", HttpStatus.BAD_REQUEST);
            }
            return new ResponseEntity<>(productoService.actualizarProductoDesdeDTO(producto), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Actualizar el stock de un producto (aumentar o reducir)
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable(name = "id") String id, @RequestBody NuevaCantidadDTO nuevaCantidadDTO) {
        try {
            if (nuevaCantidadDTO.getNuevaCantidad() < 0) {
                return new ResponseEntity<>("La nueva cantidad no puede ser negativa", HttpStatus.BAD_REQUEST);
            }
            Producto producto = productoService.updateStock(id, nuevaCantidadDTO.getNuevaCantidad(), nuevaCantidadDTO.getNotas());
            return new ResponseEntity<>(producto, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Disminuir el stock de un producto por pérdidas
    @PutMapping("/{id}/disminuir-stock")
    public ResponseEntity<?> disminuirStockPorPerdida(
            @PathVariable(name = "id") String id,
            @RequestBody Map<String, Object> request) {
        try {
            Integer cantidadADisminuir = null;
            String notas = null;

            // Extraer cantidadADisminuir
            if (request.get("cantidadADisminuir") instanceof Integer) {
                cantidadADisminuir = (Integer) request.get("cantidadADisminuir");
            } else if (request.get("cantidadADisminuir") instanceof String) {
                try {
                    cantidadADisminuir = Integer.parseInt((String) request.get("cantidadADisminuir"));
                } catch (NumberFormatException e) {
                    return new ResponseEntity<>("El valor de cantidadADisminuir debe ser un número entero", HttpStatus.BAD_REQUEST);
                }
            }

            // Extraer notas
            if (request.get("notas") instanceof String) {
                notas = (String) request.get("notas");
            }

            if (cantidadADisminuir == null || cantidadADisminuir <= 0) {
                return new ResponseEntity<>("La cantidad a disminuir debe ser mayor que 0", HttpStatus.BAD_REQUEST);
            }

            Producto producto = productoService.disminuirStockPorPerdida(id, cantidadADisminuir, notas);
            ProductoDTO productoDTO = productoService.findById(id);

            return new ResponseEntity<>(productoDTO, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Eliminar un producto
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            productoService.delete(id);
            return new ResponseEntity<>("Producto Eliminado", HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}