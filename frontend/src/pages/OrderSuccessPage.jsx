import { Link, useLocation } from "react-router-dom";

export default function OrderSuccessPage() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const code = params.get("code");

  return (
    <div className="center">
      <div className="card authCard">
        <h1 className="h1">Pedido enviado ✅</h1>
        <p className="p">Guarde este código para acompanhar seu pedido:</p>

        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 4,
            textAlign: "center",
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {code || "SEM CÓDIGO"}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <Link
            to="/"
            className="btn btnPrimary"
            style={{ flex: 1, textAlign: "center" }}
          >
            Voltar ao cardápio
          </Link>
        </div>

        <hr className="hr" />
        <span className="badge">🕒 A cozinha já recebeu seu pedido</span>
      </div>
    </div>
  );
}
