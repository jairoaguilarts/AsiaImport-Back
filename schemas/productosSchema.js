const mongoose = require("mongoose");

const productosSchema = new mongoose.Schema({
  ID: {
    type: String,
    required: true,
  },
  DepartamentoID: {
    type: String,
    required: true,
  },
  CategoriaID: {
    type: String,
    required: true,
  },
  Descripcion: {
    type: String,
    required: true,
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
  PrecioA: {
    type: String,
    required: true,
  },
  PrecioB: {
    type: String,
    required: true,
  },
  ImagenID: {
    type: String,
    required: true,
  },
  Cantidad: {
    type: String,
    required: true,
  },
});

const productos = mongoose.model("productos", productosSchema);
module.exports = productos;
