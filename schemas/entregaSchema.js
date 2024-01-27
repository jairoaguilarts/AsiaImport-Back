const mongoose = require("mongoose");

const entregaSchema = new mongoose.Schema({
  departamento: {
    type: String,
    required: true,
  },
  municipio: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  puntoreferencia: {
    type: String,
    required: true,
  },
  id_usuario: {
    type: String,
    required: true,
  },
  estadoOrden: {
    type: String,
    required: true,
  },
  fecha_ingreso: {
    type: String,
    required: true,
  },
  numerotelefono: {
    type: String,
    required: true,
  },
}, { discriminatorKey: 'order_type' });

const entregas = mongoose.model("entregas", entregaSchema);
module.exports = entregas;