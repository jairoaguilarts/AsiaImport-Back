const mongoose = require("mongoose");

const InfoGSchema = new mongoose.Schema({
  mision: {
    type: String,
    required: true,
  },
  vision: {
    type: String,
    required: true,
  },
  historia: {
    type: String,
    required: true,
  },
  precioEnvio: {
    type: Number,
    required: true,
  },
  precioEnvioOtros: {
    type: Number,
    required: true,
  },
});

const Infog = mongoose.model("infog", InfoGSchema);
module.exports = Infog;
