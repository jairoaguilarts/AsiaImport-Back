const mongoose = require("mongoose");

const UsuariosSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  apellido: {
    type: String,
    required: true,
  },
  correo: {
    type: String,
    required: true,
  },
  numeroIdentidad: {
    type: String,
    required: true,
    unique: true,
  },
  userType: {
    type: String,
    required: true,
  },
  carritoCompras: {
    type: [String],
    default: [],
  },
  cantidadCarrito: {
    type: [String],
    default: [],
  },
  totalCarrito: {
    type: String,
    default: "",
    required: false,
  },
  favoritos: {
    type: [String],
    default: [],
  },
});

const usuario = mongoose.model("usuario", UsuariosSchema, "usuarios");
module.exports = usuario;
