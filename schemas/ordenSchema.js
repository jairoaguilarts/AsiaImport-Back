const mongoose = require("mongoose");
const Entrega = require("./entregaSchema");
const { type } = require("os");

const ordenSchema = new mongoose.Schema({
    nombre_usuario: {
        type: String,
        required: true,
    },
    firebaseUID: {
        type: String,
        required: true,
    },
    tipoOrden: {
        type: String,
        required: true,
    },
    carrito: {
        type: [String],
        default: [],
        required: true,
    },
    cantidades: {
        type: [String],
        default: [],
    },
    detalles: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entrega",
        required: true,
    },
    estadoOrden: {
        type: String,
        required: true,
    },
    detallePago: {
        type: String
    },
    total: {
        type: String,
    },
    Fecha: {
        type: String,
        required: true,
    },
});

const ordenes = mongoose.model("ordenes", ordenSchema, "ordenes");
module.exports = ordenes;