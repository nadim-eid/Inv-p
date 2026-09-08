import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import Scanner from "./pages/Scanner.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Inventory from "./pages/Inventory.jsx";
import History from "./pages/History.jsx";
import Label from "./pages/Label.jsx";

export default function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ajouter" element={<AddProduct />} />
      <Route path="/etiquette/:id" element={<Label />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/produit/:id" element={<ProductDetail />} />
      <Route path="/inventaire" element={<Inventory />} />
      <Route path="/historique" element={<History />} />
    </Routes>
  );
}
