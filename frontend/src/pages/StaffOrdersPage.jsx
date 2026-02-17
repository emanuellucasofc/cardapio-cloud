import { useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL;
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;

function moneyBR(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0,00";
  return n.toFixed(2).replace(".", ",");
}

function statusLabel(s) {
  if (s === "preparing") return "EM PREPARO";
  if (s === "done") return "PRONTO";
  return "NOVO";
}

function statusClass(s) {
  if (s === "preparing") return "badge warn";
  if (s === "done") return "badge ok";
  return "badge new";
}

export default function StaffOrdersPage() {
  const [token, setToken] = useState(localStorage.getItem("staff_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [connecting, setConnecting] = useState(false);

  const esRef = useRef(null);

  function login(e) {
    e.preventDefault();
    localStorage.setItem("staff_token", tokenInput);
    setToken(tokenInput);
    setTokenInput("");
  }

  function logout() {
    localStorage.removeItem("staff_token");
    setToken("");
    setOrders([]);
    try {
      esRef.current?.close();
    } catch {}
    esRef.current = null;
  }

  async function updateStatus(orderId, status) {
    try {
      const res = await fetch(`${API}/api/staff/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-staff-token": token,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao atualizar status.");
      // Não precisa fazer refresh: o SSE atualiza sozinho
    } catch (e) {
      console.error(e);
      alert("Falha ao atualizar status.");
    }
  }

  // Conexão em tempo real via SSE
  useEffect(() => {
    if (!token) return;

    setConnecting(true);

    // Fecha conexão anterior se existir
    try {
      esRef.current?.close();
    } catch {}
    esRef.current = null;

    // Passamos o token via query porque EventSource não permite header custom
    // (segurança: é só para ambiente local / MVP)
    const url = `${API}/api/staff/orders/stream?restaurantId=${encodeURIComponent(
      RESTAURANT_ID
    )}&token=${encodeURIComponent(token)}`;

    // ✅ Ajuste no backend: vamos aceitar token via query também.
    // (Abaixo eu te dou o patch pra isso)
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("orders", (ev) => {
      try {
        const arr = JSON.parse(ev.data);
        setOrders(Array.isArray(arr) ? arr : []);
      } catch {}
      setConnecting(false);
    });

    es.addEventListener("ping", () => {
      setConnecting(false);
    });

    es.addEventListener("error", (e) => {
      console.error("SSE error", e);
      setConnecting(false);
      // Não dá alert toda hora, só log
    });

    return () => {
      try {
        es.close();
      } catch {}
    };
  }, [token]);

  const grouped = useMemo(() => {
    const news = [];
    const preparing = [];
    const done = [];

    for (const o of orders) {
      if (o.status === "done") done.push(o);
      else if (o.status === "preparing") preparing.push(o);
      else news.push(o);
    }

    return { news, preparing, done };
  }, [orders]);

  if (!token) {
    return (
      <div className="center">
        <div className="card authCard">
          <h1 className="h1">Funcionário</h1>
          <p className="p">Acesso restrito. Digite o token da equipe.</p>

          <form className="formGrid" onSubmit={login}>
            <input
              className="input"
              placeholder="Token do funcionário"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <button className="btn btnPrimary">Entrar</button>
          </form>

          <hr className="hr" />
          <span className="badge">🔒 Somente equipe</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="h1" style={{ marginBottom: 4 }}>
            Pedidos • Trigo Leve
          </h1>
          <p className="p" style={{ margin: 0 }}>
            {connecting ? "Conectando..." : "Ao vivo (tempo real) ✅"}
          </p>
        </div>

        <button className="btn btnDanger btnSmall" onClick={logout}>
          Sair
        </button>
      </div>

      <div className="kitchenGrid" style={{ marginTop: 14 }}>
        <Column
          title="NOVOS"
          hint="Chegaram agora"
          orders={grouped.news}
          renderActions={(o) => (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btnSmall btnPrimary"
                onClick={() => updateStatus(o.id, "preparing")}
              >
                Iniciar preparo
              </button>
              <button
                className="btn btnSmall"
                onClick={() => updateStatus(o.id, "done")}
              >
                Marcar pronto
              </button>
            </div>
          )}
        />

        <Column
          title="EM PREPARO"
          hint="Em andamento"
          orders={grouped.preparing}
          renderActions={(o) => (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btnSmall"
                onClick={() => updateStatus(o.id, "new")}
              >
                Voltar p/ novo
              </button>
              <button
                className="btn btnSmall btnPrimary"
                onClick={() => updateStatus(o.id, "done")}
              >
                Marcar pronto
              </button>
            </div>
          )}
        />

        <Column
          title="PRONTOS"
          hint="Finalizados"
          orders={grouped.done}
          renderActions={(o) => (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btnSmall"
                onClick={() => updateStatus(o.id, "preparing")}
              >
                Voltar p/ preparo
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function Column({ title, hint, orders, renderActions }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <div className="smallMuted">{hint}</div>
        </div>
        <span className="badge">{orders.length}</span>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {orders.length === 0 ? (
          <div className="smallMuted">Nenhum pedido aqui.</div>
        ) : null}

        {orders.map((o) => (
          <div key={o.id} className="card" style={{ padding: 12, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 900, letterSpacing: 2 }}>
                {o.code}
              </div>
              <span className={statusClass(o.status)}>{statusLabel(o.status)}</span>
            </div>

            <div className="smallMuted" style={{ marginTop: 6 }}>
              Cliente: {o.customer?.name} • {o.customer?.phone}
            </div>

            <hr className="hr" />

            <div style={{ display: "grid", gap: 6 }}>
              {(o.items || []).map((it, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 800 }}>
                    {it.qty}x {it.name}
                  </div>
                  <div className="smallMuted">
                    R$ {moneyBR(Number(it.price) * Number(it.qty))}
                  </div>
                </div>
              ))}
            </div>

            <hr className="hr" />

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
              <span>Total</span>
              <span>R$ {moneyBR(o.total)}</span>
            </div>

            <div style={{ marginTop: 10 }}>
              {renderActions(o)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
