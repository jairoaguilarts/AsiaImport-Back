const mongoose = require("mongoose");

const productosSchema = new mongoose.Schema({
  Nombre: {
    type: String,
    required: true,
  },
  Categoria: {
    type: String,
    required: true,
  },
  Descripcion: {
    type: String,
    required: false,
  },
  Caracteristicas: {
    type: String,
    required: false,
  },
  Modelo: {
    type: String,
    required: true,
    unique: true,
  },
  Precio: {
    type: String,
    required: true,
  },

  ImagenID: {
    type: [String],
    required: false,
    default: [],
  },
  Cantidad: {
    type: String,
    required: true,
  },
});

const productos = mongoose.model("productos", productosSchema);
module.exports = productos;
