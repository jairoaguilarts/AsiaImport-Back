const mongoose = require("mongoose");

const entregaSchema = new mongoose.Schema({
  departamento: {
    type: String,
  },
  municipio: {
    type: String,
  },
  direccion: {
    type: String,
  },
  puntoreferencia: {
    type: String,
  },
  firebaseUID: {
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
  nombreUsuario: {
    type: String,
  },
  identidadUsuario: {
    type: String,
  },
  tipoOrden: {
    type: String,
    required: true,
  },
});

const Entrega = mongoose.model("Entrega", entregaSchema, "entregas");
module.exports = Entrega;