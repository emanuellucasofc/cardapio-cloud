const admin = require("firebase-admin");

// Evita inicializar duas vezes (nodemon / hot reload)
function init() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON não definido no .env do backend"
    );
  }

  // Pode vir como JSON em uma linha
  const serviceAccount = JSON.parse(raw);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function db() {
  init();
  return admin.firestore();
}

module.exports = { db, admin };
