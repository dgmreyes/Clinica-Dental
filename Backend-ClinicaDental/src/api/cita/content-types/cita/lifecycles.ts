const { ApplicationError } = require('@strapi/utils').errors;

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    let pacienteId;

    if (typeof data.paciente === 'number' || typeof data.paciente === 'string') {
      pacienteId = data.paciente;
    } else if (data.paciente && data.paciente.connect && data.paciente.connect.length > 0) {
      pacienteId = data.paciente.connect[0].id;
    }
    if (!pacienteId) return;

    const citaExistente = await strapi.db.query('api::cita.cita').findOne({
      where: {
        paciente: pacienteId, 
        Estado: {
          $in: ['Pendiente', 'Confirmada'],
        },
      },
    });

    // 3. Si encontramos una cita, lanzamos el error
    if (citaExistente) {
      throw new ApplicationError('El paciente ya tiene una cita activa. Debe completar o cancelar la anterior antes de agendar una nueva.');
    }
  },
};