const mongoose = require('mongoose');

const UsuariosSchema = new mongoose.Schema({
    correo: {
        type: String,
        required: true,
        unique: true
    },
    contrasenia: {
        type: String,
        required: true
    },
    firebaseUID: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    numeroIdentidad: {
        type: String,
        required: true,
        unique: true
    },
    carritoCompras: {
        type: [String],
        default: []
    },
    favoritos: {
        type: [String],
        default: []
    }
});

const usuario = mongoose.model('usuario', UsuariosSchema);
module.exports = usuario;
