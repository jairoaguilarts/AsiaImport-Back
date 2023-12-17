const mongoose = require("mongoose");

const carruselSchema = new mongoose.Schema({
    imagenID: {
        type: [String],
        default: [],
        required: false,
    },
    nNombre: {
        type: String,
        required: false
    },
});

const carrusel = mongoose.model("carrusel", carruselSchema);
module.exports = carrusel;