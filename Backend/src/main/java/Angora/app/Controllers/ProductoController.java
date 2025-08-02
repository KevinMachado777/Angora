package Angora.app.Controllers;

import Angora.app.Entities.Producto;
import Angora.app.Services.IProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/inventarioProducto")
@RestController

public class ProductoController {

    @Autowired
    private IProductoService productoService;

    @GetMapping
    public List<Producto> listarProductos(){
        var productos = productoService.listarProductos();
        return productos;
    }

    @PutMapping("/{cantidadComprada}")
    public void actualizarStock(@RequestBody Producto producto, @PathVariable int cantidadComprada){
        productoService.disminuirStock(producto, cantidadComprada);
    }
}
