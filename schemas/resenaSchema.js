const mongoose = require("mongoose");

const resenaSchema = new mongoose.Schema({
    Nombre: {
        type: String,
        required: true
    },
    Modelo: {
        type: String,
        required: true,
    },
    Calificacion: {
        type: String,
        required: true,
    },
    Titulo: {
        type: String,
        required: true,
    },
    Comentario: {
        type: String,
    },
});

const resenas = mongoose.model("resena", resenaSchema);
module.exports = resenas;