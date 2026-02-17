require("dotenv").config();

const express = require("express");
const cors = require("cors");

const leadsRoutes = require("./routes/leads");
const menuRoutes = require("./routes/menu");
const adminRoutes = require("./routes/admin");
const ordersRoutes = require("./routes/orders");
const staffOrdersRoutes = require("./routes/staffOrders");
const staffOrdersStreamRoutes = require("./routes/staffOrdersStream");
const staffOrdersUpdateRoutes = require("./routes/staffOrdersUpdate");

const app = express();

// ✅ CORS PRIMEIRO (antes de qualquer rota)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cardapio-frontend.onrender.com"
    ],
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","x-staff-token"]
  })
);

// ✅ Preflight

// ✅ JSON
app.use(express.json());

// rotas
app.use("/api/leads", leadsRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/orders", ordersRoutes);

// staff
app.use("/api/staff/orders", staffOrdersRoutes);
app.use("/api/staff/orders", staffOrdersStreamRoutes);
app.use("/api/staff/orders", staffOrdersUpdateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
