import { Routes, Route, Link } from "react-router-dom";
import MenuPage from "./pages/MenuPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import StaffOrdersPage from "./pages/StaffOrdersPage.jsx";

export default function App() {
  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <span className="brandDot" />
          <span>Trigo Leve</span>
          <span className="badge">Cardápio</span>
        </div>

        <div className="navlinks">
          <Link to="/">Cardápio</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/funcionario">Funcionário</Link>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/pedido" element={<OrderSuccessPage />} />
        <Route path="/funcionario" element={<StaffOrdersPage />} />
      </Routes>
    </div>
  );
}
