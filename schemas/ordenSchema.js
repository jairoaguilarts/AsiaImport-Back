const mongoose = require("mongoose");
const Entrega = require("./entregaSchema");
const { type } = require("os");

const ordenSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true,
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