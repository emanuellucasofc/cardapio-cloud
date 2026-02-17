module.exports = function requireStaff(req, res, next) {
  const tokenHeader = req.headers["x-staff-token"];
  const tokenQuery = req.query.token;

  const token = tokenHeader || tokenQuery;

  if (!process.env.STAFF_TOKEN) {
    return res.status(500).json({ error: "STAFF_TOKEN não configurado." });
  }
  if (!token || token !== process.env.STAFF_TOKEN) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  next();
};
