package Angora.app.Controllers.dto;

import java.util.List;

public class ConfirmarFacturaDTO {
    private boolean actualizarCartera;
    private List<FacturaProductoDTO> productos;

    public boolean isActualizarCartera() {
        return actualizarCartera;
    }

    public void setActualizarCartera(boolean actualizarCartera) {
        this.actualizarCartera = actualizarCartera;
    }

    public List<FacturaProductoDTO> getProductos() {
        return productos;
    }

    public void setProductos(List<FacturaProductoDTO> productos) {
        this.productos = productos;
    }

    public static class FacturaProductoDTO {
        private Long idProducto;
        private Integer cantidad;

        public Long getIdProducto() {
            return idProducto;
        }

        public void setIdProducto(Long idProducto) {
            this.idProducto = idProducto;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
    }
}