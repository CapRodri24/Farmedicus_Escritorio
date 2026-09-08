require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");

const app = express();

// =====================================================
// RUTAS
// =====================================================

const authRoutes = require("./src/routes/authRoutes");
const ManagementSectionRoutes = require("./src/routes/ManagementSectionRoutes");
const productsRoutes = require("./src/routes/productsRoutes");
const formularioProductoRoutes = require("./src/routes/FormularioProductoRoutes");
const notesRoutes = require("./src/routes/notesRoutes");
const usersRoutes = require("./src/routes/usersRoutes");
const ventasRoutes = require("./src/routes/ventasRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const alertsRoutes = require("./src/routes/alertsRoutes");
const salesRoutes = require("./src/routes/salesRoutes");
const reportesRoutes = require("./src/routes/reportesRoutes");
const cotizacionesRoutes = require("./src/routes/cotizacionesRoutes");
const homeRoutes = require("./src/routes/HomeRoutes");
const cajaRoutes = require("./src/routes/cajaRoutes");
const cashRoutes = require("./src/routes/cashRoutes");
const pagosRoutes = require("./src/routes/pagosRoutes");
const ecommerceRoutes = require("./src/routes/ecommerceRoutes");

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "https://lumyra-farmacia.netlify.app",
  "https://farmmedicus-back.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite herramientas como Postman y Electron
    if (!origin) {
      return callback(null, true);
    }

    if (
      allowedOrigins.some((allowedOrigin) =>
        origin.includes(
          allowedOrigin.replace(/^https?:\/\//, "")
        )
      )
    ) {
      return callback(null, true);
    }

    const msg = `El origen ${origin} no tiene permiso de acceso.`;

    return callback(new Error(msg), false);
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// =====================================================
// RUTAS API
// =====================================================

app.use("/api", authRoutes);
app.use("/api", ManagementSectionRoutes);
app.use("/api", productsRoutes);
app.use("/api", formularioProductoRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", ventasRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", alertsRoutes);
app.use("/api", salesRoutes);
app.use("/api", reportesRoutes);
app.use("/api", cotizacionesRoutes);
app.use("/api", homeRoutes);
app.use("/api", cajaRoutes);
app.use("/api", cashRoutes);
app.use("/api", pagosRoutes);
app.use("/api", ecommerceRoutes);

// =====================================================
// MANEJADOR GLOBAL DE ERRORES
// =====================================================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "127.0.0.1", () => {
      console.log(
        `Backend iniciado en http://127.0.0.1:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Error al iniciar el servidor:",
      error
    );

    process.exit(1);
  }
};

startServer();