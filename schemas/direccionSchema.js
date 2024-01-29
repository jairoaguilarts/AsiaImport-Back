const mongoose = require("mongoose");

const direccionSchema = new mongoose.Schema({
    userFirebaseUID: {
        type: String,
        required: true
    },
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
    puntoReferencia: {
        type: String,
    },
    numeroTelefono: {
        type: String,
        required: true,
    },
});

const direcciones = mongoose.model("direccion", direccionSchema);
module.exports = direcciones;