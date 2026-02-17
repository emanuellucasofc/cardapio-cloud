const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebase");
const requireStaff = require("../middlewares/requireStaff");

router.get("/", requireStaff, async (req, res) => {
  const restaurantId = req.query.restaurantId || "default";

  try {
    let orders = [];
    try {
      const snap = await db()
        .collection("orders")
        .where("restaurantId", "==", restaurantId)
        .orderBy("createdAt", "asc") // ordem de chegada (antigos primeiro)
        .get();

      orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      // fallback se faltar índice
      const snap = await db()
        .collection("orders")
        .where("restaurantId", "==", restaurantId)
        .get();

      orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      orders.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return ta - tb;
      });
    }

    return res.json({ ok: true, orders });
  } catch (e) {
    console.error("STAFF ORDERS ERROR:", e);
    return res.status(500).json({ error: "Erro ao carregar pedidos." });
  }
});

module.exports = router;
