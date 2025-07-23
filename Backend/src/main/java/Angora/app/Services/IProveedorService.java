package Angora.app.Services;

import Angora.app.Entities.Proveedor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface IProveedorService {

    public List<Proveedor> listarProveedores();
    public Proveedor buscarProveedorPorId(Long idProveedor);
    public void guardarProveedor(Proveedor proveedor);
    public void eliminarProveedor(Long idProveedor);


}
