package Angora.app.Services;

import Angora.app.Entities.Proveedor;
import Angora.app.Repositories.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProveedorService implements IProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Override
    public List<Proveedor> listarProveedores() {
        List<Proveedor> proveedores = proveedorRepository.findAll();
        return proveedores;
    }

    @Override
    public Proveedor buscarProveedorPorId(Long idProveedor) {
        Proveedor proveedor = proveedorRepository.findById(idProveedor).orElse(null);
        return proveedor;
    }

    @Override
    public void guardarProveedor(Proveedor proveedor) {
        proveedorRepository.save(proveedor);
    }

    @Override
    public void eliminarProveedor(Long idProveedor) {

        proveedorRepository.deleteById(idProveedor);

    }

    public boolean existeCorreoEnProveedor(String correo, Long idProveedor) {
        // Verifica si existe otro proveedor con el mismo correo y que no sea el mismo proveedor que se está editando
        return proveedorRepository.findByCorreoAndIdProveedorNot(correo, idProveedor).isPresent();
    }
}
