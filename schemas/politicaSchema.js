const mongoose = require('mongoose');

const politicaSchema = new mongoose.Schema({
  titulo: String,
  contenido: String,
});

module.exports = mongoose.model('Politica', politicaSchema);