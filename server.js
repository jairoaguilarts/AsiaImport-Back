require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const serviceAccount = require("./importasiaauth-firebase-adminsdk-kwbl3-fa4407d620.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Configuración de Firebase
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} = require("firebase/auth");
//const { firebaseConfig, mongoUri } = require('./dbConfig/dbConfig');

const app = express();
const PORT = 3000 || process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: ["https://importasiahn.netlify.app", "http://localhost:3001"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Conectado a MongoDB"))
    .catch((e) => console.error("Error al conectar con MongoDB", e));
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
const Producto = require("./schemas/productosSchema");

app.get("/", (req, res) => {
  res.send("Hola Mundo!");
});

/* <Endpoints> */
app.get("/productos", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const productos = await Producto.find({}).limit(limit);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los productos" });
  }
});

app.get("/buscarProducto", async (req, res) => {
  try {
    const { Nombre } = req.query;
    if (!Nombre) {
      return res
        .status(400)
        .send({ message: "No se ingresó ningún parámetro" });
    }
    const productos = await Producto.find({
      $or: [{ Categoria: new RegExp(Nombre, "i") }],
    });
    if (!productos) {
      return res.status(404).send({ message: "Producto no encontrado" });
    }

    res.status(200).json(productos);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error en la búsqueda", error: error.message });
  }
});
app.post("/agregarProducto", async (req, res) => {
  const {
    Categoria,
    Nombre,
    Descripcion,
    Caracteristicas,
    Modelo,
    Precio,
    ImagenID,
    Cantidad,
    userCreatingType,
  } = req.body;

  if (userCreatingType !== "*" && userCreatingType !== "+") {
    return res.status(402).json({
      error: "Solo el administrador y los Empleados pueden agregar productos",
    });
  }
  try {
    const productoExistente = await Producto.findOne({ Modelo });
    if (productoExistente) {
      return res.status(400).json({ error: "Producto ya registrado" });
    }

    const nuevoProducto = new Producto({
      Categoria,
      Nombre,
      Descripcion,
      Caracteristicas,
      Modelo,
      Precio,
      ImagenID,
      Cantidad,
    });

    await nuevoProducto.save();
    res.json(nuevoProducto);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete("/eliminarProducto", async (req, res) => {
  const { userDeletingType } = req.body;
  const { Modelo } = req.query;

  if (userDeletingType !== "*" && userDeletingType !== "+") {
    return res.status(402).json({
      error: "Solo un administrador o un empleado puede eliminar productos",
    });
  }

  try {
    const result = await Producto.deleteOne({ Modelo });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Error al eliminar producto" });
    } else {
      res.json({ message: "Producto eliminado exitosamente" });
    }
  } catch (error) {
    res.status(500).json({ error: "Ocurrió un error al eliminar producto" });
  }
});

app.post("/signUp", async (req, res) => {
  const { correo, contrasenia, nombre, apellido, numeroIdentidad } = req.body;
  try {
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({ error: "Usuario ya registrado" });
    }

    const userType = "-";
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      correo,
      numeroIdentidad,
      userType,
    });

    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        correo,
        contrasenia
      );
      const user = userCredential.user;
      nuevoUsuario.firebaseUID = user.uid;
      await sendEmailVerification(user);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error en Firebase", message: error.message });
    }

    await nuevoUsuario.save();
    res.json(nuevoUsuario);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/agregarEmpleado", async (req, res) => {
  const {
    correo,
    contrasenia,
    nombre,
    apellido,
    numeroIdentidad,
    userCreatingType,
  } = req.body;

  if (userCreatingType != "*") {
    return res
      .status(402)
      .json({ error: "Solo el administrador puede registrar empleados" });
  }

  try {
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({ error: "Empleado ya registrado" });
    }

    const userType = "+";
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      correo,
      numeroIdentidad,
      userType,
    });

    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        correo,
        contrasenia
      );
      const user = userCredential.user;
      nuevoUsuario.firebaseUID = user.uid;
      await sendEmailVerification(user);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error en Firebase", message: error.message });
    }

    await nuevoUsuario.save();
    res.json(nuevoUsuario);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/modificarProducto", async (req, res) => {
  const { Descripcion, Caracteristicas, ImagenID, Precio, Cantidad } = req.body;
  const { Modelo } = req.query;

  try {
    let actualizaciones = {};
    if (Descripcion !== undefined) {
      actualizaciones.Descripcion = Descripcion;
    }
    if (Caracteristicas !== undefined) {
      actualizaciones.Caracteristicas = Caracteristicas;
    }
    if (ImagenID !== undefined) {
      actualizaciones.ImagenID = ImagenID;
    }
    if (Precio !== undefined) {
      actualizaciones.Precio = Precio;
    }
    if (Cantidad !== undefined) {
      actualizaciones.Cantidad = Cantidad;
    }

    const productoActualizado = await Producto.findOneAndUpdate(
      { Modelo },
      actualizaciones,
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(productoActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.put("/modificarEmpleado", async (req, res) => {
  const { nombre, apellido, numeroIdentidad, userModifyingType } = req.body;
  const { firebaseUID } = req.query;

  if (userModifyingType != "*" || userModifyingType != "+") {
    return res
      .status(402)
      .json({ error: "Solo el administrador puede modificar empleados" });
  }

  try {
    let actualizaciones = {};
    if (nombre !== undefined) {
      actualizaciones.nombre = nombre;
    }
    if (apellido !== undefined) {
      actualizaciones.apellido = apellido;
    }
    if (numeroIdentidad !== undefined) {
      actualizaciones.numeroIdentidad = numeroIdentidad;
    }
    const usuario = await Usuario.findOneAndUpdate(
      { firebaseUID },
      actualizaciones,
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      numeroIdentidad: usuario.numeroIdentidad,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.delete("/eliminarEmpleado", async (req, res) => {
  const { userDeletingType } = req.body;
  const { firebaseUID } = req.query;

  if (userDeletingType != "*") {
    return res
      .status(402)
      .json({ error: "Solo el administrador puede eliminar empleados" });
  }

  try {
    await admin.auth().deleteUser(firebaseUID);

    const result = await Usuario.deleteOne({ firebaseUID });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Error al eliminar empleado" });
    } else {
      res.json({ message: "Empleado eliminado con éxito" });
    }
  } catch (error) {
    res.status(500).json({ error: "Ocurrió un error al eliminar empleado" });
  }
});

app.put("/hacerAdmin", async (req, res) => {
  const { firebaseUID } = req.query;

  if (!firebaseUID) {
    return res.status(400).json({ error: "Se requiere el Firebase UID" });
  }

  try {
    const result = await Usuario.findOneAndUpdate(
      { firebaseUID: firebaseUID },
      { userType: "*" },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario actualizado a administrador",
      usuario: result,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

app.put("/perfil", async (req, res) => {
  const { nombre, apellido, identidad } = req.body;
  const { firebaseUID } = req.query;

  try {
    const usuario = await Usuario.findOneAndUpdate(
      { firebaseUID },
      { nombre, apellido, numeroIdentidad: identidad },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      numeroIdentidad: usuario.numeroIdentidad,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/perfil", async (req, res) => {
  const { firebaseUID } = req.query;
  try {
    const usuario = await Usuario.findOne({ firebaseUID });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      numeroIdentidad: usuario.numeroIdentidad,
    });
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/logIn", async (req, res) => {
  const { correo, contrasenia } = req.body;
  try {
    if (!correo.trim() || !contrasenia.trim()) {
      return res
        .status(400)
        .json({ error: "Error falta el Correo o Contraseña " });
    }
    const auth = getAuth();
    let firebaseUID = "";
    let nombre = "";
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correo,
        contrasenia
      );
      const user = userCredential.user;
      if (!user.emailVerified) {
        return res
          .status(401)
          .json({ error: "Correo electrónico no verificado" });
      }
      firebaseUID = user.uid;
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      return res.status(500).send({
        msg: "Credenciales incorrectas",
      });
    }

    const usuario = await Usuario.findOne({ firebaseUID });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      usuario: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        numeroIdentidad: usuario.numeroIdentidad,
        userType: usuario.userType,
        firebaseUID: usuario.firebaseUID,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post("/recoverPassword", async (req, res) => {
  const { correo } = req.body;
  if (!correo) {
    return res.status(400).json({ error: "Correo electrónico es requerido" });
  }

  const auth = getAuth();
  sendPasswordResetEmail(auth, correo)
    .then(() => {
      res.status(200).json({ message: "Correo de recuperación enviado" });
    })
    .catch((error) => {
      console.error("Error al enviar correo de recuperación:", error);
      res.status(500).json({ error: error.code, message: error.message });
    });
});

app.get("/logOut", (req, res) => {
  const auth = getAuth();
  signOut(auth)
    .then(() => {
      res.status(200).send({
        msg: "Cierre de sesión exitoso",
      });
    })
    .catch((error) => {
      res.status(500).send({
        msg: "Error al cerrar sesión",
      });
    });
});

app.get("/empleados", (req, res) => {
  Usuario.find({ userType: "+" })
    .then((empleados) => {
      res.json(empleados);
    })
    .catch((error) => {
      res.status(500).json({ error: "Error al obtener empleados" });
    });
});

/* </Endpoints> */

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
});
