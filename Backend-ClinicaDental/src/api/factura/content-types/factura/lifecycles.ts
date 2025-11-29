'use strict';


const calcularPrecioFinal = (subtotal, Descuento) => {
  //si no hay subtotal o descuento devolver null
  if (subtotal === undefined || subtotal === null || Descuento === undefined || Descuento === null) {
    return null; 
  }


  const bruto = parseFloat(subtotal);
  // Asegurarse de que el porcentaje de descuento esté entre 0 y 100
  const perc = Math.max(0, Math.min(100, parseFloat(Descuento)));
 // Asegurarse de que los valores son números válidos
  if (isNaN(bruto) || isNaN(perc)) {
    return null;
  }
  // Calcular el precio final después de aplicar el descuento
  const descuentoAplicado = bruto * (perc / 100);
  const totalFinal = bruto - descuentoAplicado;
  
  return Math.round(totalFinal * 100) / 100;
};

export default {

  async beforeCreate(event) {
    const { data } = event.params;
    const precioFinal = calcularPrecioFinal(data.subtotal, data.Descuento);
    if (precioFinal !== null) {
      data.Total = precioFinal;
    }
  },


  async beforeUpdate(event) {
    const { data, where } = event.params;

    if (data.subtotal !== undefined || data.Descuento !== undefined) {
      const entradaActual = await strapi.db.query('api::factura.factura').findOne({ where });
      if (!entradaActual) return;

      const subtotalFinal = data.subtotal ?? entradaActual.subtotal;
      const descuentoFinal = data.Descuento ?? entradaActual.Descuento;
      const precioFinal = calcularPrecioFinal(subtotalFinal, descuentoFinal);

      if (precioFinal !== null) {
        data.Total = precioFinal;
      }
    }
  },
};
