const mongoose = require('mongoose');

const UsuariosSchema = new mongoose.Schema({
    nombreUsuario: {
        type: String,
        required: true,
        unique: true
    },
    firebaseUID: {
        type: String,
        required: true
    },
    nombreCompleto: {
        type: String,
        required: true
    },
    numeroIdentidad: {
        type: String,
        required: true,
        unique: true
    },
    sexo: {
        type: String,
        required: true,
        enum: ['Masculino', 'Femenino', 'Otro']  
    },
    carritoCompras: {
        type: [String],
        default: []
    }
});

const usuario = mongoose.model('usuario', UsuariosSchema);
module.exports = usuario;
