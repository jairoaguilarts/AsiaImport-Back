const mongoose = require("mongoose");

const ordenSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true,
    },
    id_usuario: {
        type: String,
        required: true,
    },
    order_type: {
        type: String,
        required: true,
        enum: ["entregas", "pickup"],
    },
    carritoProductos: {
        type: [String],
        default: [],
    },
    detalles: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'order_type',
        },
        required: true,
    },
    estadoOrden: {
        type: String,
        required: true,
    },
    fecha_ingreso: {
        type: String,
        required: true,
    },
    entrega_id: {
        type: ObjectId,
        required: true,
    }
});     

const orden = mongoose.model("orden", ordenSchema);
module.exports = { orden };