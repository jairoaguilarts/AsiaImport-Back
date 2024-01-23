require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { getStorage } = require("firebase/storage");
const functions = require("firebase-functions");
const fileUpload = require("express-fileupload");
const path = require("path");
const os = require("os");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require('nodemailer');

const serviceAccount = require("./importasiaauth-firebase-adminsdk-kwbl3-fa4407d620.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "importasiaauth.appspot.com",
});

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
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

const app = express();
const PORT = 3000 || process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

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
      useFindAndModify: false
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
const storage = getStorage(appFirebase);

// Schemas
const Usuario = require("./schemas/usuarioSchema");
const Producto = require("./schemas/productosSchema");
const Infog = require("./schemas/InfoGSchema");
const Carrusel = require("./schemas/carruselSchema");
const Politica = require('./schemas/politicaSchema');

const { Console } = require("console");
const productos = require("./schemas/productosSchema");

app.get("/", (req, res) => {
  res.send("Hola Mundo!");
});

/* <Endpoints> */



app.get("/productosP", async (req, res) => {
  try {
    const productos = await Producto.find({});
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los productos" });
  }
});


app.get("/buscarProductoCategoria", async (req, res) => {
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

app.get("/buscarProductoNombre", async (req, res) => {
  try {
    const { Nombre } = req.query;
    if (!Nombre) {
      return res
        .status(400)
        .send({ message: "No se ingresó ningún parámetro" });
    }
    const productos = await Producto.find({
      $or: [{ Nombre: new RegExp(Nombre, "i") }],
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

app.get("/buscarProductoModelo", async (req, res) => {
  try {
    const { Modelo } = req.query;
    if (!Modelo) {
      return res
        .status(400)
        .send({ message: "No se ingresó ningún parámetro" });
    }
    const productos = await Producto.findOne({
      $or: [{ Modelo: new RegExp(Modelo, "i") }],
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

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(401).send("No se encontraron archivos para subir.");
    }

    let uploadFile = req.files.uploadedFile;
    let filePath = `${Categoria}/${uploadFile.name}`;

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const stream = file.createWriteStream({
      metadata: {
        contentType: uploadFile.mimetype,
      },
    });

    stream.on("error", (e) => {
      console.error(e);
      res.status(500).send(e);
    });

    stream.on("finish", async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        const nuevoProducto = new Producto({
          Categoria,
          Nombre,
          Descripcion,
          Caracteristicas,
          Modelo,
          Precio,
          ImagenID: publicUrl,
          Cantidad,
        });

        await nuevoProducto.save();
        return res.json({
          producto: nuevoProducto,
          message: "Producto e imagen subidos exitosamente.",
        });
      } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message });
      }
    });

    stream.end(uploadFile.data);
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
    const producto = await Producto.findOne({ Modelo });
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const imagenPath = producto.ImagenID;
    const bucket = admin.storage().bucket();

    /*if (Array.isArray(imagenPath)) {
      for (const path of imagenPath) {
        await bucket.file(path).delete();
      }
    } else {
      await bucket.file(imagenPath).delete();
    }*/

    const result = await Producto.deleteOne({ Modelo });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Error al eliminar producto" });
    }

    res.json({ message: "Producto e imagen(es) eliminados exitosamente" });
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

    const usuarioExistenteID = await Usuario.findOne({ numeroIdentidad });
    if (usuarioExistenteID) {
      return res.status(401).json({ error: "Usuario ya registrado" });
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

  if (userCreatingType !== "*") {
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
  const { Nombre, Descripcion, Caracteristicas, Precio, Cantidad, Categoria, fileSelected } =
    req.body;
  const { Modelo } = req.query;
  let uploadFile;

  if (fileSelected !== undefined) {
    uploadFile = req.files.uploadedFile;
  }

  try {
    let actualizaciones = {};
    if (Nombre !== undefined) {
      actualizaciones.Nombre = Nombre;
    }
    if (Categoria !== undefined) {
      actualizaciones.Categoria = Categoria;
    }
    if (Descripcion !== undefined) {
      actualizaciones.Descripcion = Descripcion;
    }
    if (Caracteristicas !== undefined) {
      actualizaciones.Caracteristicas = Caracteristicas;
    }
    if (Precio !== undefined) {
      actualizaciones.Precio = Precio;
    }
    if (Cantidad !== undefined) {
      actualizaciones.Cantidad = Cantidad;
    }
    if (fileSelected !== undefined) {
      const productoActual = await Producto.findOne({ Modelo });
      const bucket = admin.storage().bucket();

      const newImagePath = `${Categoria}/${uploadFile.name}`;
      const file = bucket.file(newImagePath);
      const stream = file.createWriteStream({
        metadata: {
          contentType: uploadFile.mimetype,
        },
      });

      stream.on("error", (e) => {
        throw e;
      });

      stream.on("finish", async () => {
        await file.makePublic();
      });

      stream.end(uploadFile.data);
      actualizaciones.ImagenID = `https://storage.googleapis.com/${bucket.name}/${newImagePath}`;
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
    console.log(error);
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

app.put("/editarInformacionEmpresa", async (req, res) => {
  try {
    const { mision, vision, historia } = req.body;
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: "El ID del documento es necesario para la actualización" });
    }

    const infoEmpresaActualizada = await Infog.findByIdAndUpdate(
      id,
      { mision, vision, historia },
      { new: true }
    );

    if (!infoEmpresaActualizada) {
      return res.status(404).json({ error: "Información de la empresa no encontrada" });
    }

    res.json({ mensaje: "Información de la empresa actualizada correctamente", infoEmpresaActualizada });
  } catch (error) {
    res.status(500).json({ error: "Error al editar la información de la empresa", message: error.message });
  }
});

app.get("/obtenerInformacion", async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: "El ID del documento es necesario para la consulta" });
    }

    const infoEmpresa = await Infog.findById(id);

    if (!infoEmpresa) {
      return res.status(404).json({ error: "Información de la empresa no encontrada" });
    }

    const { mision, vision, historia } = infoEmpresa;
    res.json({ mision, vision, historia });
  } catch (error) {
    res.status(500).json({ error: "Error al cargar la información de la empresa", message: error.message });
  }
});

app.put("/destacarProducto", async (req, res) => {
  const { Destacado } = req.body;
  const { Modelo } = req.query;
  try {

    const productoDestacado = await Producto.findOneAndUpdate(
      { Modelo },
      { Destacado },
      { new: true }
    );

    if (!productoDestacado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(productoDestacado);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/agregarCarrito", async (req, res) => {
  const { firebaseUID, Modelo } = req.body;

  try {
    const user = await Usuario.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    // Verificar si el modelo ya está en el carrito
    const existeProducto = user.carritoCompras.find(item => item === Modelo);
    if (existeProducto) {
      return res.status(400).send('El producto ya está en el carrito');
    }

    user.carritoCompras.push(Modelo);
    await user.save();

    res.status(200).send('Item agregado al carrito de compras');
  } catch (error) {
    res.status(500).send('Error al agregar item al carrito: ' + error.message);
  }
});

app.post("/agregarFavoritos", async (req, res) => {
  const { firebaseUID, Modelo } = req.body;

  try {
    const user = await Usuario.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    // Verificar si el modelo ya está en el carrito
    const existeProducto = user.favoritos.find(item => item === Modelo);
    if (existeProducto) {
      return res.status(400).send('El producto ya está en el carrito');
    }

    user.favoritos.push(Modelo);
    await user.save();

    res.status(200).send('Item agregado al carrito de compras');
  } catch (error) {
    res.status(500).send('Error al agregar item al carrito: ' + error.message);
  }
});

app.delete("/eliminarDelCarrito", async (req, res) => {
  const { firebaseUID, Modelo } = req.body;

  try {
    const user = await Usuario.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    // Filtrar el carrito para eliminar el producto con el modelo dado
    const carritoOriginal = user.carritoCompras;
    user.carritoCompras = carritoOriginal.filter(item => item !== Modelo);

    // Si la longitud del carrito no cambia, el producto no estaba en el carrito
    if (carritoOriginal.length === user.carritoCompras.length) {
      return res.status(404).send('Producto no encontrado en el carrito');
    }

    await user.save();
    res.status(200).send('Producto eliminado del carrito de compras');
  } catch (error) {
    res.status(500).send('Error al eliminar el producto del carrito: ' + error.message);
  }
});

app.get("/obtenerCarrito/:firebaseUID", async (req, res) => {
  const { firebaseUID } = req.params;

  try {
    const user = await Usuario.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    let productos = [];

    for (const Modelo of user.carritoCompras) {
      let prod = await Producto.findOne({ Modelo })
      if (prod) {
        productos.push(prod);
      }
    }
    res.json(productos);
  } catch (error) {
    res.status(500).send('Error al obtener carrito');
  }
});
app.get("/obtenerFavoritos/:firebaseUID", async (req, res) => {
  const { firebaseUID } = req.params;

  try {
    const user = await Usuario.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    let productos = [];

    for (const Modelo of user.favoritos) {
      let prod = await Producto.findOne({ Modelo })
      if (prod) {
        productos.push(prod);
      }
    }
    res.json(productos);
  } catch (error) {
    res.status(500).send('Error al obtener carrito');
  }
});
app.post("/agregarImgCarruselInicio", async (req, res) => {
  try {

    let uploadFile = req.files.uploadedFile;
    if (!uploadFile) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo." });
    }

    const bucket = admin.storage().bucket();
    const fileName = `Carrusel_Inicio/${uploadFile.name}`;
    const storageFile = bucket.file(fileName);

    const carrusel = await Carrusel.findOne();
    if (carrusel.imagenID.length > 5) {
      return res.status(400).json({ error: "Se alcanzó el límite máximo de 5 imágenes." });
    }

    const stream = storageFile.createWriteStream({
      metadata: {
        contentType: uploadFile.mimetype
      },
    });

    stream.on("error", (e) => {
      console.error(e);
      res.status(500).send(e);
    });

    stream.on("finish", async () => {
      try {

        await storageFile.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        carrusel.imagenID.push(publicUrl);
        await carrusel.save();

        return res.json({ success: true });

      } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message })
      }
    });

    stream.end(uploadFile.data);
  } catch (error) {
    res.status(500).json({ error: "Error al agregar imagenes " + error.message });
  }
});

app.get("/obtenerCarruselInicio", async (req, res) => {
  try {
    console.log("Hola!!");
    const carruselData = await Carrusel.find({});
    if (!carruselData) {
      return res.status(404).json({ error: "No se encontraron datos en el carrusel" });
    }

    res.json(carruselData);

  } catch (error) {
    res.status(500).send({ error: "Error al extraer las imagenes " + error.message })
  }
});

app.post("/eliminarImgCarruselInicio", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "Selecciona una imagen" });
    }

    const carrusel = await Carrusel.findOne();
    if (carrusel.imagenID.length < 2) {
      return res.status(400).json({ error: "No se pueden eliminar imágenes, el limite minimo es de 2 imagenes" });
    }

    const index = carrusel.imagenID.findIndex((url) => url === imageUrl);
    if (index !== -1) {
      carrusel.imagenID.splice(index, 1);
    } else {
      return res.status(404).json({ error: "La imagen no se encontro en la lista" })
    }
    await carrusel.save();

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la imagen " + error.message });
  }
});
app.get("/politicas", async (req, res) => {
  try {
    const politicas = await Politica.find({});
    res.json(politicas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las políticas" });
  }
});

app.put("/editarPoliticaPrivacidad", async (req, res) => {
  try {
    const { contenido } = req.body;
    const politicaActualizada = await Politica.findOneAndUpdate(
      { titulo: "Políticas de privacidad de asia import" },
      { contenido },
      { new: true, upsert: true }
    );

    if (!politicaActualizada) {
      return res.status(404).json({ error: "Política de privacidad no encontrada" });
    }

    res.json({ mensaje: "Política de privacidad actualizada correctamente", politicaActualizada });
  } catch (error) {
    res.status(500).json({ error: "Error al editar la política de privacidad", message: error.message });
  }
});

app.post('/send-complaint', (req, res) => {
  const { historia, datosPersonales } = req.body; // Ahora esperamos un objeto datosPersonales

  try {
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'importasiaquejas@gmail.com', 
      subject: 'Nueva Queja o Reclamo',
      text: `Historia de la queja o reclamo: ${historia}\nNombre: ${datosPersonales.nombre}\nEdad: ${datosPersonales.edad}\nCorreo Electrónico: ${datosPersonales.email}`, 
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo', error: error.message });
      }
      console.log('Email enviado:', info.response);
      res.status(200).json({ message: 'Correo enviado exitosamente' });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});
/* </Endpoints> */

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
});
