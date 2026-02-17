const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebase");
const requireStaff = require("../middlewares/requireStaff");

// PATCH /api/staff/orders/:id/status
router.patch("/:id/status", requireStaff, async (req, res) => {
  try {
    const id = req.params.id;
    const status = String(req.body.status || "").trim();

    const allowed = ["new", "preparing", "done"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    await db().collection("orders").doc(id).update({
      status,
      updatedAt: new Date(),
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("UPDATE STATUS ERROR:", e);
    return res.status(500).json({ error: "Erro ao atualizar status." });
  }
});

module.exports = router;
