import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { useStore } from './store/useStore';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Users, ShoppingCart, Upload, Home, Download, Menu, X, Settings, Package, List, Gift, LayoutGrid } from "lucide-react";
import Produtos from "./pages/Produtos";
import ProdutoDetalhes from "./pages/ProdutoDetalhes";
import Listas from "./pages/Listas";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Compras from "./pages/Compras";
import Importar from "./pages/Importar";
import Exportar from "./pages/Exportar";
import Configuracoes from "./pages/Configuracoes";
import Presentes from "./pages/Presentes";


function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void }) {
  const { logout } = useAuth();
  const invalidateCache = useStore(state => state.invalidateCache);
  const location = useLocation();
  
  const navLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? "bg-purple-50 text-purple-700 font-semibold" 
        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium"
    }`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 flex flex-col z-50 transform transition-transform duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between md:justify-center">
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgBZlM5xr0iWggqFs8IGWOKXulvk7gQWFFP5fsfrKnQw4aBNDonQGtVz9x-wpUJXQRpZBGDMV1p4fnfZbAydP0yFcKVqJQIdKR4vXK5qfuthZAHapBoKBv5sLPsxlMnhLcdYxTBL5_AH6QmNBUiFewszEBN3J5WuTPxOFizZbVlvqQqtAMelMOHev1fAd4/w200-h200/logo%20trans.png" alt="Ateliê do Ju" className="h-20 object-contain mx-auto" />
          <button className="md:hidden text-neutral-900" onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/" onClick={() => setMobileOpen(false)} className={navLinkClass("/")}>
            <Home size={20} />
            <span>Painel</span>
          </Link>
          <Link to="/clientes" onClick={() => setMobileOpen(false)} className={navLinkClass("/clientes")}>
            <Users size={20} />
            <span>Clientes</span>
          </Link>
          <Link to="/produtos" onClick={() => setMobileOpen(false)} className={navLinkClass("/produtos")}>
            <Package size={20} />
            <span>Produtos</span>
          </Link>
          <Link to="/listas" onClick={() => setMobileOpen(false)} className={navLinkClass("/listas")}>
            <List size={20} />
            <span>Listas Salvas</span>
          </Link>
          <Link to="/presentes" onClick={() => setMobileOpen(false)} className={navLinkClass("/presentes")}>
            <Gift size={20} />
            <span>Presentes</span>
          </Link>
          <Link to="/compras" onClick={() => setMobileOpen(false)} className={navLinkClass("/compras")}>
            <ShoppingCart size={20} />
            <span>Compras</span>
          </Link>
          <Link to="/importar" onClick={() => setMobileOpen(false)} className={navLinkClass("/importar")}>
            <Upload size={20} />
            <span>Importar</span>
          </Link>
          <Link to="/exportar" onClick={() => setMobileOpen(false)} className={navLinkClass("/exportar")}>
            <Download size={20} />
            <span>Exportar</span>
          </Link>
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <Link to="/configuracoes" onClick={() => setMobileOpen(false)} className={navLinkClass("/configuracoes")}>
              <Settings size={20} />
              <span>Configurações</span>
            </Link>
          </div>
        
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <button onClick={() => {
               
               // clear any local memory if needed, though state is wiped on navigate normally if unmounted
               logout(); invalidateCache();
            }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
  </nav>
      </aside>
    </>
  );
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-neutral-600 hover:text-neutral-900">
            <Menu size={24} />
          </button>
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgBZlM5xr0iWggqFs8IGWOKXulvk7gQWFFP5fsfrKnQw4aBNDonQGtVz9x-wpUJXQRpZBGDMV1p4fnfZbAydP0yFcKVqJQIdKR4vXK5qfuthZAHapBoKBv5sLPsxlMnhLcdYxTBL5_AH6QmNBUiFewszEBN3J5WuTPxOFizZbVlvqQqtAMelMOHev1fAd4/w200-h200/logo%20trans.png" alt="Ateliê do Ju" className="h-10 object-contain mx-auto" />
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:email" element={<ClienteDetalhes />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/:id" element={<ProdutoDetalhes />} />
            <Route path="/listas" element={<Listas />} />
              <Route path="/presentes" element={<Presentes />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/importar" element={<Importar />} />
            <Route path="/exportar" element={<Exportar />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<Layout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

