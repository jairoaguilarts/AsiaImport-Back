require('dotenv').config({ path: './dbConfig/credentials.env' });
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const admin = require('firebase-admin'); // Importando Firebase Admin

// Configuración de Firebase Admin
const serviceAccount = require('./dbConfig/importasiaauth-firebase-adminsdk-kwbl3-fa4407d620.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Configuración de Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } = require('firebase/auth');
const { firebaseConfig, mongoUri } = require('./dbConfig/dbConfig');

const appFirebase = initializeApp(firebaseConfig);

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Conectado a MongoDB"))
  .catch(e => console.error('Error al conectar con MongoDB', e));

// Schemas
const Usuario = require("./schemas/usuarioSchema");

app.get('/', (req, res) => {
  res.send('Hola Mundo!');
});

app.post('/signUp', async (req, res) => {
  const { correo, contrasenia, nombre, apellido, numeroIdentidad } = req.body;
  try {
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Usuario ya registrado' });
    }

    const nuevoUsuario = new Usuario({ correo, contrasenia, nombre, apellido, numeroIdentidad });

    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contrasenia);
      const user = userCredential.user;
      nuevoUsuario.firebaseUID = user.uid;
      await sendEmailVerification(user);
    } catch (error) {
      return res.status(500).send("Error en Firebase: " + error.message);
    }

    await nuevoUsuario.save();
    res.json(nuevoUsuario);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/logIn', async (req, res) => {
  const { correo, contrasenia } = req.body;
  try {
    if (!correo.trim() || !contrasenia.trim()) {
      return res.status(400).json({ error: 'Error falta el Correo o Contraseña ' });
    }
    const auth = getAuth();
    let firebaseUID = '';
    try {
      const userCredential = await signInWithEmailAndPassword(auth, correo, contrasenia);
      const user = userCredential.user;
      firebaseUID = user.uid;
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      return res.status(500).send({
        "msg": "Credenciales incorrectas"
      });
    }

    const usuario = await Usuario.findOne({ firebaseUID });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (!usuario.emailVerified) { 
      return res.status(401).json({ error: 'Correo electrónico no verificado' }); 
    }

    res.json({
      success: true,
      usuario: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        firebaseUID: usuario.firebaseUID
      }
    });
  } catch (error) {
    console.log('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});