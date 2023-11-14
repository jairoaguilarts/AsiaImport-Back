require('dotenv').config({ path: './dbConfig/credentials.env' });
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Imports necesarios para la auth con firebase
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { firebaseConfig, mongoUri } = require('./dbConfig/dbConfig');

const app = express();
const appFirebase = initializeApp(firebaseConfig);

const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Schemas
const Usuario = require("./schemas/usuarioSchema");

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

app.post('/signUp', async (req, res) => {
  const { correo, contrasenia, nombre, apellido, numeroIdentidad } = req.body;
  try {
    // Comprueba si ya existe un usuario con el correo
    const usuarioExistente = await Usuario.findOne({
      $or: [
        { correo: correo }
      ]
    });
    if (usuarioExistente) {
      let errorMessage = '';
      if (usuarioExistente.correo === correo) {
        errorMessage = 'Ya existe un usuario registrado con ese correo, por favor Inicia Sesion';
      } 
      return res.status(400).json({ error: errorMessage });
    }

    const nuevoUsuario = new Usuario({ correo, contrasenia, nombre, apellido, numeroIdentidad });

    // Crea el usuario en firebase
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasenia);
      const user = userCredential.user;
      nuevoUsuario.firebaseUID = user.uid;
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      return res.status(500).send("El usuario no pudo ser creado en firebase");
    }

    await nuevoUsuario.save();
    console.log('Usuario creado');
    res.json(nuevoUsuario);
  } catch (error) {
    console.log('Error al agregar usuario:', error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
