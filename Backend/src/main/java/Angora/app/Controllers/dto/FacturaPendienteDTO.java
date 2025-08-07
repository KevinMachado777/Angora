package Angora.app.Controllers.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class FacturaPendienteDTO {
    private Long idFactura;
    private LocalDateTime fecha;
    private ClienteDTO cliente;
    private List<ProductoDTO> productos;
    private Integer subtotal; // Changed to Float
    private Integer total; // Changed to Float
    private Integer saldoPendiente;
    private String estado;
    private CarteraDTO idCartera;
    private UsuarioDTO cajero;
    private String notas;

    // Getters y setters
    public Long getIdFactura() {
        return idFactura;
    }

    public void setIdFactura(Long idFactura) {
        this.idFactura = idFactura;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public ClienteDTO getCliente() {
        return cliente;
    }

    public void setCliente(ClienteDTO cliente) {
        this.cliente = cliente;
    }

    public List<ProductoDTO> getProductos() {
        return productos;
    }

    public void setProductos(List<ProductoDTO> productos) {
        this.productos = productos;
    }

    public Integer getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Integer subtotal) {
        this.subtotal = subtotal;
    }

    public Integer getTotal() {
        return total;
    }

    public void setTotal(Integer total) {
        this.total = total;
    }

    public Integer getSaldoPendiente() {
        return saldoPendiente;
    }

    public void setSaldoPendiente(Integer saldoPendiente) {
        this.saldoPendiente = saldoPendiente;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public CarteraDTO getIdCartera() {
        return idCartera;
    }

    public void setIdCartera(CarteraDTO idCartera) {
        this.idCartera = idCartera;
    }

    public UsuarioDTO getCajero() {
        return cajero;
    }

    public void setCajero(UsuarioDTO cajero) {
        this.cajero = cajero;
    }

    public static class ClienteDTO {
        private Long idCliente;
        private String nombre;
        private String apellido;
        private String correo; // Changed from email to correo

        public Long getIdCliente() {
            return idCliente;
        }

        public void setIdCliente(Long idCliente) {
            this.idCliente = idCliente;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public String getCorreo() {
            return correo;
        }

        public void setCorreo(String correo) {
            this.correo = correo;
        }

        public String getApellido() {
            return apellido;
        }

        public void setApellido(String apellido) {
            this.apellido = apellido;
        }
    }

    public static class ProductoDTO {
        private Long id;
        private String nombre;
        private Integer cantidad;
        private Integer precio;
        private Boolean iva; // Added to support IVA calculation

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }

        public Integer getPrecio() {
            return precio;
        }

        public void setPrecio(Integer precio) {
            this.precio = precio;
        }

        public Boolean getIva() {
            return iva;
        }

        public void setIva(Boolean iva) {
            this.iva = iva;
        }
    }

    public static class CarteraDTO {
        private Long idCartera;
        private Float abono;
        private Float deudas;
        private Boolean estado;

        public Long getIdCartera() {
            return idCartera;
        }

        public void setIdCartera(Long idCartera) {
            this.idCartera = idCartera;
        }

        public Float getAbono() {
            return abono;
        }

        public void setAbono(Float abono) {
            this.abono = abono;
        }

        public Float getDeudas() {
            return deudas;
        }

        public void setDeudas(Float deudas) {
            this.deudas = deudas;
        }

        public Boolean getEstado() {
            return estado;
        }

        public void setEstado(Boolean estado) {
            this.estado = estado;
        }
    }

    public static class UsuarioDTO {
        private Long id;
        private String nombre;
        private String apellido;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public String getApellido() {
            return apellido;
        }

        public void setApellido(String apellido){
            this.apellido = apellido;
        }
    }
}