import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [tokenInput, setTokenInput] = useState("");

  const [categories, setCategories] = useState([]);

  const [catName, setCatName] = useState("");
  const [catOrder, setCatOrder] = useState(1);

  const [categoryId, setCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState(19.9);
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCats() {
    const res = await fetch(`${API}/api/menu?restaurantId=${RESTAURANT_ID}`);
    const data = await res.json();
    const cats = data.categories || [];
    setCategories(cats);
    if (!categoryId && cats[0]?.id) setCategoryId(cats[0].id);
  }

  useEffect(() => { loadCats(); }, []);

  function login(e){
    e.preventDefault();
    localStorage.setItem("admin_token", tokenInput);
    setToken(tokenInput);
    setTokenInput("");
  }

  function logout(){
    localStorage.removeItem("admin_token");
    setToken("");
  }

  async function createCategory(e){
    e.preventDefault();
    try{
      setLoading(true);
      const res = await fetch(`${API}/api/admin/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({
          restaurantId: RESTAURANT_ID,
          name: catName,
          order: Number(catOrder) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao criar categoria");

      alert("Categoria criada ✅");
      setCatName("");
      await loadCats();
    } finally {
      setLoading(false);
    }
  }

  async function createItem(e){
    e.preventDefault();
    try{
      setLoading(true);
      const res = await fetch(`${API}/api/admin/item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({
          restaurantId: RESTAURANT_ID,
          categoryId,
          name: itemName,
          description: itemDesc,
          price: Number(itemPrice),
          imageUrl: itemImageUrl,
          available: true
        })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao criar item");

      alert("Item criado ✅");
      setItemName("");
      setItemDesc("");
      setItemImageUrl("");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="center">
        <div className="card authCard">
          <h1 className="h1">Admin</h1>
          <p className="p">
            Digite seu token para liberar o painel.
          </p>

          <form className="formGrid" onSubmit={login}>
            <input
              className="input"
              placeholder="Token do admin"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <button className="btn btnPrimary">Entrar</button>
          </form>

          <hr className="hr" />
          <span className="badge">🔐 O token fica só no seu navegador</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12 }}>
        <div>
          <h1 className="h1" style={{ marginBottom: 4 }}>Admin</h1>
          <div className="p" style={{ margin: 0 }}>Crie categorias e itens do cardápio.</div>
        </div>
        <button className="btn btnDanger btnSmall" onClick={logout}>Sair</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Criar categoria</h3>
          <form className="formGrid" onSubmit={createCategory}>
            <input
              className="input"
              placeholder="Nome da categoria"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <input
              className="input"
              type="number"
              placeholder="Ordem"
              value={catOrder}
              onChange={(e) => setCatOrder(e.target.value)}
            />
            <button className="btn btnPrimary" disabled={loading}>
              {loading ? "Salvando..." : "Criar categoria"}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Criar item</h3>
          <form className="formGrid" onSubmit={createItem}>
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Nome do item"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Descrição"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Preço"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
            />
            <input
              className="input"
              placeholder="Image URL (opcional)"
              value={itemImageUrl}
              onChange={(e) => setItemImageUrl(e.target.value)}
            />

            <button className="btn btnPrimary" disabled={loading}>
              {loading ? "Salvando..." : "Criar item"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
