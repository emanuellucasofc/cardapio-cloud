const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { db } = require("../lib/firebase");

function genCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

router.post("/", async (req, res) => {
  try {
    const restaurantId = req.body.restaurantId || "default";
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").replace(/\D/g, "");
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!name || name.length < 2) return res.status(400).json({ error: "Nome inválido." });
    if (phone.length < 10) return res.status(400).json({ error: "Telefone inválido." });
    if (items.length === 0) return res.status(400).json({ error: "Carrinho vazio." });

    // normaliza itens
    const cleanItems = items.map((it) => ({
      id: String(it.id || ""),
      name: String(it.name || ""),
      price: Number(it.price || 0),
      qty: Number(it.qty || 0),
    })).filter((x) => x.id && x.name && x.qty > 0);

    if (cleanItems.length === 0) return res.status(400).json({ error: "Itens inválidos." });

    const total = cleanItems.reduce((acc, x) => acc + x.price * x.qty, 0);

    // código aleatório (pode repetir muito raramente; aqui tratamos com retry simples)
    let code = genCode(6);
    for (let i = 0; i < 3; i++) {
      const existing = await db().collection("orders").where("restaurantId", "==", restaurantId).where("code", "==", code).limit(1).get();
      if (existing.empty) break;
      code = genCode(6);
    }

    await db().collection("orders").add({
      restaurantId,
      code,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      customer: { name, phone },
      items: cleanItems,
      total,
    });

    return res.json({ ok: true, code });
  } catch (e) {
    console.error("ORDER CREATE ERROR:", e);
    return res.status(500).json({ error: "Erro ao criar pedido." });
  }
});

module.exports = router;
