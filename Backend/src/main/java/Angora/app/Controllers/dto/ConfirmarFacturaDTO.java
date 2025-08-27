package Angora.app.Controllers.dto;

import java.util.List;

public class ConfirmarFacturaDTO {
    private List<FacturaProductoDTO> productos;

    public List<FacturaProductoDTO> getProductos() {
        return productos;
    }

    public void setProductos(List<FacturaProductoDTO> productos) {
        this.productos = productos;
    }

    public static class FacturaProductoDTO {
        private String idProducto;
        private Integer cantidad;
        private String tipoPrecio; // "detal", "mayorista", or "opcional"
        private Double precioOpcional; // Custom price when tipoPrecio is "opcional"

        public String getIdProducto() {
            return idProducto;
        }

        public void setIdProducto(String idProducto) {
            this.idProducto = idProducto;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }

        public String getTipoPrecio() {
            return tipoPrecio;
        }

        public void setTipoPrecio(String tipoPrecio) {
            this.tipoPrecio = tipoPrecio;
        }

        public Double getPrecioOpcional() {
            return precioOpcional;
        }

        public void setPrecioOpcional(Double precioOpcional) {
            this.precioOpcional = precioOpcional;
        }
    }
}