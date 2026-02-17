import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL;
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;

const CART_KEY = `cart_${RESTAURANT_ID}`;
const NAME_KEY = `lead_name_${RESTAURANT_ID}`;
const PHONE_KEY = `lead_phone_${RESTAURANT_ID}`;

function moneyBR(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0,00";
  return n.toFixed(2).replace(".", ",");
}

function cleanPhoneDigits(phone) {
  return (phone || "").replace(/\D/g, "");
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function MenuPage() {
  const [unlocked, setUnlocked] = useState(
    localStorage.getItem("menu_unlocked") === "1"
  );

  // nome/telefone persistidos
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) || "");

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingLead, setLoadingLead] = useState(false);

  // carrinho persistido
  const [cart, setCart] = useState(() => {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? safeParse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // persistências
  useEffect(() => {
    localStorage.setItem(NAME_KEY, name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem(PHONE_KEY, phone);
  }, [phone]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((acc, x) => acc + x.qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      Object.values(cart).reduce(
        (acc, x) => acc + Number(x.item.price || 0) * x.qty,
        0
      ),
    [cart]
  );

  function addToCart(item) {
    setCart((prev) => {
      const cur = prev[item.id];
      const nextQty = (cur?.qty || 0) + 1;
      return { ...prev, [item.id]: { item, qty: nextQty } };
    });
    // NÃO abre automaticamente ✅
  }

  function inc(itemId) {
    setCart((prev) => {
      const cur = prev[itemId];
      if (!cur) return prev;
      return { ...prev, [itemId]: { ...cur, qty: cur.qty + 1 } };
    });
  }

  function dec(itemId) {
    setCart((prev) => {
      const cur = prev[itemId];
      if (!cur) return prev;
      const nextQty = cur.qty - 1;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: { ...cur, qty: nextQty } };
    });
  }

  function clearCart() {
    setCart({});
  }

  async function submitLead(e) {
    e.preventDefault();

    const digits = cleanPhoneDigits(phone);
    if (String(name || "").trim().length < 2) return alert("Digite seu nome.");
    if (digits.length < 10) return alert("Digite DDD + número (10 ou 11 dígitos).");

    try {
      setLoadingLead(true);

      const url = `${API}/api/leads`;
      console.log("Enviando lead:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(name).trim(),
          phone: digits,
          restaurantId: RESTAURANT_ID,
        }),
      });

      const text = await res.text();
      console.log("Status /api/leads:", res.status);
      console.log("Resposta /api/leads:", text);

      let data = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) return alert(data.error || `Erro HTTP ${res.status}`);

      localStorage.setItem(NAME_KEY, String(name).trim());
      localStorage.setItem(PHONE_KEY, digits);

      localStorage.setItem("menu_unlocked", "1");
      setUnlocked(true);
    } catch (e) {
      console.error("Erro submitLead:", e);
      alert("Falha ao enviar dados.");
    } finally {
      setLoadingLead(false);
    }
  }

  async function loadMenu() {
    const url = `${API}/api/menu?restaurantId=${RESTAURANT_ID}`;
    const res = await fetch(url);
    const data = await res.json();
    setCategories(data.categories || []);
    setItems(data.items || []);
  }

  useEffect(() => {
    if (unlocked) loadMenu();
  }, [unlocked]);

  // remove do carrinho itens que não existem mais
  useEffect(() => {
    if (!unlocked) return;
    if (!items.length) return;

    const validIds = new Set(items.map((x) => x.id));
    setCart((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        if (!validIds.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const grouped = useMemo(() => {
    const byCat = new Map();
    categories.forEach((c) => byCat.set(c.id, []));
    items.forEach((it) => {
      if (!byCat.has(it.categoryId)) byCat.set(it.categoryId, []);
      byCat.get(it.categoryId).push(it);
    });
    return byCat;
  }, [categories, items]);

  async function finalizeOrder() {
    if (cartCount === 0) return;

    const digits = cleanPhoneDigits(phone);
    if (String(name || "").trim().length < 2) return alert("Nome inválido.");
    if (digits.length < 10) return alert("Telefone inválido.");

    const payloadItems = Object.values(cart).map(({ item, qty }) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty,
    }));

    try {
      setFinalizing(true);

      const url = `${API}/api/orders`;
      console.log("Finalizando pedido em:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: RESTAURANT_ID,
          name: String(name).trim(),
          phone: digits,
          items: payloadItems,
        }),
      });

      const text = await res.text();
      console.log("Status /api/orders:", res.status);
      console.log("Resposta /api/orders (texto):", text);

      let data = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) return alert(data.error || `Erro HTTP ${res.status}`);

      if (!data?.code) {
        alert("Pedido criado, mas não veio código. Veja o console.");
        console.log("Resposta /api/orders (json):", data);
        return;
      }

      setCart({});
      localStorage.removeItem(CART_KEY);
      setCartOpen(false);

      window.location.href = `/pedido?code=${encodeURIComponent(data.code)}`;
    } catch (e) {
      console.error("Erro finalizeOrder:", e);
      alert("Falha ao finalizar pedido.");
    } finally {
      setFinalizing(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="center">
        <div className="card authCard">
          <h1 className="h1">Trigo Leve</h1>
          <p className="p">Digite seus dados para acessar o cardápio completo.</p>

          <form className="formGrid" onSubmit={submitLead}>
            <input
              className="input"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="input"
              placeholder="Telefone (DDD + número)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button className="btn btnPrimary" disabled={loadingLead}>
              {loadingLead ? "Entrando..." : "Ver cardápio"}
            </button>
          </form>

          <hr className="hr" />
          <span className="badge">🛒 Carrinho e dados ficam salvos</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div className="menuHeader">
        <div>
          <h1 className="menuTitle">Cardápio • Trigo Leve</h1>
          <p className="menuSubtitle">Adicione itens no carrinho 👇</p>
        </div>

        <button
          className="btn btnDanger btnSmall"
          onClick={() => {
            localStorage.removeItem("menu_unlocked");
            localStorage.removeItem(CART_KEY);
            localStorage.removeItem(NAME_KEY);
            localStorage.removeItem(PHONE_KEY);

            setUnlocked(false);
            setCart({});
            setCartOpen(false);
            setName("");
            setPhone("");
          }}
        >
          Sair
        </button>
      </div>

      {categories.map((cat) => {
        const catItems = grouped.get(cat.id) || [];
        return (
          <div key={cat.id} className="catBlock">
            <div className="catRow">
              <h2 className="catName">{cat.name}</h2>
              <span className="badge">{catItems.length} itens</span>
            </div>

            <div className="ifoodList">
              {catItems.map((it) => (
                <div key={it.id} className="ifoodItem">
                  <div className="itemInfo">
                    <h3 className="itemName2">{it.name}</h3>
                    {it.description ? (
                      <p className="itemDesc2">{it.description}</p>
                    ) : (
                      <p className="itemDesc2" style={{ opacity: 0.7 }}>
                        Sem descrição
                      </p>
                    )}

                    <div className="itemBottom">
                      <div className="itemPrice2">R$ {moneyBR(it.price)}</div>

                      <div className="itemActions">
                        <button className="addBtn" onClick={() => addToCart(it)}>
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="itemImage">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt={it.name} />
                    ) : (
                      <span className="placeholderIcon">🍔</span>
                    )}
                  </div>
                </div>
              ))}

              {catItems.length === 0 ? (
                <div className="ifoodItem" style={{ opacity: 0.75 }}>
                  <div className="itemInfo">
                    <h3 className="itemName2">Nenhum item ainda</h3>
                    <p className="itemDesc2">
                      Vá em Admin e cadastre itens para aparecer aqui.
                    </p>
                  </div>
                  <div className="itemImage">
                    <span className="placeholderIcon">🧾</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* FAB carrinho */}
      <button className="cartFab" onClick={() => setCartOpen(true)}>
        <span>🛒 Carrinho</span>
        <span className="cartCount">{cartCount}</span>
      </button>

      {/* Painel do carrinho */}
      {cartOpen ? (
        <>
          <div className="cartOverlay" onClick={() => setCartOpen(false)} />
          <div className="cartPanel">
            <div className="cartHeader">
              <h3 className="cartTitle">Seu carrinho</h3>
              <button className="btn btnSmall" onClick={() => setCartOpen(false)}>
                Fechar
              </button>
            </div>

            <div className="cartBody">
              {cartCount === 0 ? (
                <div className="smallMuted">
                  Seu carrinho está vazio. Adicione itens 🙂
                </div>
              ) : (
                Object.values(cart).map(({ item, qty }) => (
                  <div key={item.id} className="cartRow">
                    <div className="cartRowLeft">
                      <p className="cartItemName">{item.name}</p>
                      <p className="cartItemSub">
                        R$ {moneyBR(item.price)} • subtotal: R$ {moneyBR(Number(item.price) * qty)}
                      </p>
                    </div>

                    <div className="qty">
                      <button className="qtyBtn" onClick={() => dec(item.id)}>-</button>
                      <div className="qtyNum">{qty}</div>
                      <button className="qtyBtn" onClick={() => inc(item.id)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cartFooter">
              <div className="cartTotalRow">
                <span>Total</span>
                <span>R$ {moneyBR(cartTotal)}</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btnSmall"
                  onClick={clearCart}
                  disabled={cartCount === 0 || finalizing}
                >
                  Limpar
                </button>

                <button
                  className="btn btnPrimary"
                  style={{ flex: 1 }}
                  disabled={cartCount === 0 || finalizing}
                  onClick={finalizeOrder}
                >
                  {finalizing ? "Enviando..." : "Finalizar pedido"}
                </button>
              </div>

              <div style={{ marginTop: 10 }} className="smallMuted">
                Você pode fechar o carrinho e continuar escolhendo.
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
