import api from '../api/axiosInstance';

class DashboardService {
  
// Obtener configuración de envío automático
async getConfiguracionEnvio() {
  try {
    const response = await api.get('/dashboard/configuracion-envio');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo configuración de envío:', error);
    throw error;
  }
}

// Guardar configuración de envío automático
async guardarConfiguracionEnvio(configuracion) {
  try {
    const response = await api.post('/dashboard/configuracion-envio', configuracion);
    return response.data;
  } catch (error) {
    console.error('Error guardando configuración de envío:', error);
    throw error;
  }
}

// Enviar dashboard manual (para pruebas)
async enviarDashboardManual() {
  try {
    const response = await api.post('/dashboard/enviar-manual');
    return response.data;
  } catch (error) {
    console.error('Error enviando dashboard manual:', error);
    throw error;
  }
}
  async getResumenDiario(fecha = null) {
    try {
      const params = fecha ? { fecha } : {};
      const response = await api.get('/dashboard/resumen', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen diario:', error);
      throw error;
    }
  }

  // Obtener métricas financieras con comparaciones
  async getMetricasFinancieras(fecha = null) {
    try {
      const params = fecha ? { fecha } : {};
      const response = await api.get('/dashboard/metricas-financieras', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas financieras:', error);
      throw error;
    }
  }

  // Obtener tendencias de los últimos días
  async getTendencias(dias = 7) {
    try {
      const response = await api.get('/dashboard/tendencias', { 
        params: { dias } 
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tendencias:', error);
      throw error;
    }
  }

  // NUEVOS MÉTODOS - Reemplazan getTopProductos
  
  // Obtener órdenes de compra pendientes
  async getOrdenesPendientes() {
    try {
      const response = await api.get('/dashboard/ordenes-pendientes');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo órdenes pendientes:', error);
      throw error;
    }
  }

  // Obtener pedidos pendientes (facturas no confirmadas)
  async getPedidosPendientes() {
    try {
      const response = await api.get('/dashboard/pedidos-pendientes');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo pedidos pendientes:', error);
      throw error;
    }
  }

  // Obtener alertas de inventario
  async getAlertasInventario(stockMinimo = 10) {
    try {
      const response = await api.get('/dashboard/alertas-inventario', {
        params: { stockMinimo }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alertas de inventario:', error);
      throw error;
    }
  }

  // Obtener resumen semanal
  async getResumenSemanal() {
    try {
      const response = await api.get('/dashboard/resumen-semanal');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen semanal:', error);
      throw error;
    }
  }

  // Obtener resumen mensual
  async getResumenMensual(mes = null, anio = null) {
    try {
      const params = {};
      if (mes) params.mes = mes;
      if (anio) params.anio = anio;
      const response = await api.get('/dashboard/resumen-mensual', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen mensual:', error);
      throw error;
    }
  }

  // Obtener comparación con período anterior
  async getComparacion(fechaInicio = null, fechaFin = null) {
    try {
      const params = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      const response = await api.get('/dashboard/comparacion', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo comparación:', error);
      throw error;
    }
  }
}


export default new DashboardService();