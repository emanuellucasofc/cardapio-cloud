const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebase");
const { isValidPhoneBR, cleanPhone } = require("../lib/validate");

router.post("/", async (req, res) => {
  try {
    const { name, phone, restaurantId = "default" } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: "Nome inválido." });
    }
    if (!isValidPhoneBR(phone)) {
      return res.status(400).json({ error: "Telefone inválido." });
    }

    await db().collection("leads").add({
      name: String(name).trim(),
      phone: cleanPhone(phone),
      restaurantId,
      createdAt: new Date().toISOString()
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao salvar lead." });
  }
});

module.exports = router;
