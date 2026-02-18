const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebase");
const requireStaff = require("../middlewares/requireStaff");

// GET /api/staff/orders/stream?restaurantId=default
router.get("/stream", requireStaff, async (req, res) => {
  const restaurantId = req.query.restaurantId || "default";

  // headers SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // manda um ping inicial
  res.write(`event: ping\ndata: "connected"\n\n`);

  const query = db()
    .collection("orders")
    .orderBy("createdAt", "asc");

  // listener em tempo real
  const unsubscribe = query.onSnapshot(
    (snap) => {
      const orders = snap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  .filter((o) => (o.restaurantId || "default") === restaurantId);
      res.write(`event: orders\ndata: ${JSON.stringify(orders)}\n\n`);
    },
    (err) => {
      console.error("SSE SNAPSHOT ERROR:", err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: "snapshot error" })}\n\n`);
    }
  );

  // heartbeat (mantém conexão viva)
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: "keepalive"\n\n`);
  }, 25000);

  // quando o cliente fechar, limpa tudo
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

module.exports = router;
