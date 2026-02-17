const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebase");

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  next();
}

router.post("/category", requireAdmin, async (req, res) => {
  try {
    const { name, order = 0, restaurantId = "default" } = req.body;
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: "Nome da categoria inválido." });
    }

    const doc = await db().collection("menu_categories").add({
      name: String(name).trim(),
      order: Number(order) || 0,
      restaurantId
    });

    res.json({ ok: true, id: doc.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar categoria." });
  }
});

router.post("/item", requireAdmin, async (req, res) => {
  try {
    const {
      restaurantId = "default",
      categoryId,
      name,
      description = "",
      price,
      imageUrl = "",
      available = true
    } = req.body;

    if (!categoryId) return res.status(400).json({ error: "categoryId obrigatório." });
    if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "Nome inválido." });

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: "Preço inválido." });

    const doc = await db().collection("menu_items").add({
      restaurantId,
      categoryId,
      name: String(name).trim(),
      description: String(description).trim(),
      price: p,
      imageUrl: String(imageUrl).trim(),
      available: Boolean(available)
    });

    res.json({ ok: true, id: doc.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar item." });
  }
});

module.exports = router;
