const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  nombreUser: {
    type: String,
    required: true,
  },
  identidadUser: {
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
  //   estadoPago: {
  //     type: String,
  //     required: true,
  //   },
});

const pickups = mongoose.model("pickup", pickupSchema);
module.exports = pickups;
