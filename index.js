require('dotenv').config({ path: './dbConfig/credentials.env' });
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Imports necesarios para la auth con firebase
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { firebaseConfig, mongoUri } = require('./dbConfig/dbConfig');

const app = express();

const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexion a la db de mongo
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('open', () => {
  console.log("Conectado a mongo")
})

app.get('/', (req, res) => {
  res.send('Hola Mundo!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
