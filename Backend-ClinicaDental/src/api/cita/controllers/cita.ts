'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cita.cita', ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state.user;

    if (!user) return super.find(ctx);

    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['role', 'dentista', 'paciente'],
    });

    if (!fullUser) return ctx.unauthorized("Usuario no encontrado");

    const roleName = fullUser.role ? fullUser.role.name.toLowerCase() : '';

    let filters = {};
    

    if (fullUser.dentista) {
      filters = { dentista: { documentId: { $eq: fullUser.dentista.documentId } } };
    }

    else if (fullUser.paciente) {
      filters = { paciente: { documentId: { $eq: fullUser.paciente.documentId } } };
    }

    else if (roleName === 'asistente') {
      filters = {};
    } else {

      return super.find(ctx);
    }

    try {

      const data = await strapi.documents('api::cita.cita').findMany({
        filters: filters,
        populate: ['paciente', 'dentista', 'servicio'], 
        status: 'published',
      });


      return { 
        data: data, 
        meta: { pagination: { page: 1, pageSize: data.length, total: data.length } } 
      };

    } catch (error) {
      console.error("Error en find citas:", error);
      return ctx.badRequest("Error obteniendo citas");
    }
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return super.create(ctx);


    const { data } = ctx.request.body;
    if (data && data.Fecha) {
        const fechaCita = new Date(data.Fecha);
        const hoy = new Date();
        const hoyUTC = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
        if (fechaCita.getTime() < hoyUTC.getTime()) {
            return ctx.badRequest('No se pueden agendar citas en fechas pasadas.');
        }
    }


    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['paciente'],
    });

    if (fullUser && fullUser.paciente) {
        if (!ctx.request.body.data) ctx.request.body.data = {};
        ctx.request.body.data.paciente = fullUser.paciente.documentId; 
    }

    return super.create(ctx);
  }

}));