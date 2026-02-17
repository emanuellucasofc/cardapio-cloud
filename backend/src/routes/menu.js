const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebase");

router.get("/", async (req, res) => {
  const restaurantId = req.query.restaurantId || "default";

  try {
    // CATEGORIAS
    let categories = [];
    try {
      const catsSnap = await db()
        .collection("menu_categories")
        .where("restaurantId", "==", restaurantId)
        .orderBy("order", "asc")
        .get();
      categories = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      // fallback sem orderBy (evita erro de índice)
      const catsSnap = await db()
        .collection("menu_categories")
        .where("restaurantId", "==", restaurantId)
        .get();
      categories = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // ordena no Node
      categories.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }

    // ITENS
    let items = [];
    try {
      const itemsSnap = await db()
        .collection("menu_items")
        .where("restaurantId", "==", restaurantId)
        .where("available", "==", true)
        .orderBy("name", "asc")
        .get();
      items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      // fallback sem orderBy (evita erro de índice)
      const itemsSnap = await db()
        .collection("menu_items")
        .where("restaurantId", "==", restaurantId)
        .where("available", "==", true)
        .get();
      items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));
    }

    return res.json({ restaurantId, categories, items });
  } catch (e) {
    console.error("MENU ERROR:", e);
    return res.status(500).json({ error: "Erro ao carregar cardápio." });
  }
});

module.exports = router;
