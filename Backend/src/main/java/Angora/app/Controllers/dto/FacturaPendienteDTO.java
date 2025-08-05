package Angora.app.Controllers.dto;

import java.time.LocalDateTime;
import java.util.List;

public class FacturaPendienteDTO {
    private Long idFactura;
    private LocalDateTime fecha;
    private ClienteDTO cliente;
    private List<ProductoDTO> productos;
    private Integer subtotal;
    private Integer total;
    private Float saldoPendiente;
    private String estado;
    private CarteraDTO idCartera;
    private UsuarioDTO cajero;

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

    public Float getSaldoPendiente() {
        return saldoPendiente;
    }

    public void setSaldoPendiente(Float saldoPendiente) {
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
    }

    public static class ProductoDTO {
        private Long id;
        private String nombre;
        private Integer cantidad;
        private Float precio;

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

        public Float getPrecio() {
            return precio;
        }

        public void setPrecio(Float precio) {
            this.precio = precio;
        }
    }

    public static class CarteraDTO {
        private Long idCartera;
        private Float abono;
        private Float deudas;
        private Boolean estado; // Cambiado de Integer a Boolean

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
    }
}