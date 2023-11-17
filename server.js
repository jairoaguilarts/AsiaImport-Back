require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const admin = require('firebase-admin'); // Importando Firebase Admin
const cors = require('cors');

// Configuración de Firebase Admin
const serviceAccount = require('./dbConfig/importasiaauth-firebase-adminsdk-kwbl3-fa4407d620.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Configuración de Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } = require('firebase/auth');
//const { firebaseConfig, mongoUri } = require('./dbConfig/dbConfig');

const app = express();
const PORT = 3000 || process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: 'http://localhost:3001' }));

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log("Conectado a MongoDB"))
    .catch(e => console.error('Error al conectar con MongoDB', e));
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const appFirebase = initializeApp(firebaseConfig);

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

    const nuevoUsuario = new Usuario({ nombre, apellido, correo, numeroIdentidad });

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
      if (!user.emailVerified) {
        return res.status(401).json({ error: 'Correo electrónico no verificado' });
      }
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

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  })
});