import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthService } from "./lib/authService";
import Login from "./pages/Login";
import AreaConsultor from "./pages/AreaConsultor";
import DashboardAdmin from "./pages/DashboardAdmin";
import CadastroCliente from "./pages/CadastroCliente";
import Index from "./pages/Index";
import VisualizarFicha from "./pages/VisualizarFicha";
import ConfiguracaoSistema from "./pages/ConfiguracaoSistema";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente de proteção de rotas
const ProtectedRoute = ({ children, allowedTypes }: { children: React.ReactNode; allowedTypes?: ('admin' | 'consultor')[] }) => {
  const usuario = AuthService.getUsuarioLogado();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(usuario.tipo)) {
    return <Navigate to={usuario.tipo === 'admin' ? '/dashboard-admin' : '/area-consultor'} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Redirecionar raiz baseado no login */}
          <Route path="/" element={
            AuthService.isLogado()
              ? <Navigate to={AuthService.isAdmin() ? '/dashboard-admin' : '/area-consultor'} replace />
              : <Navigate to="/login" replace />
          } />

          {/* Rotas protegidas para consultores */}
          <Route path="/area-consultor" element={
            <ProtectedRoute allowedTypes={['consultor']}>
              <AreaConsultor />
            </ProtectedRoute>
          } />
          <Route path="/cadastro-cliente" element={
            <ProtectedRoute allowedTypes={['consultor']}>
              <CadastroCliente />
            </ProtectedRoute>
          } />
          <Route path="/ficha-negociacao" element={
            <ProtectedRoute allowedTypes={['consultor']}>
              <Index />
            </ProtectedRoute>
          } />

          {/* Rotas protegidas para administradores */}
          <Route path="/dashboard-admin" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />

          {/* Rotas acessíveis para ambos */}
          <Route path="/visualizar-ficha" element={
            <ProtectedRoute>
              <VisualizarFicha />
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <ConfiguracaoSistema />
            </ProtectedRoute>
          } />

          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
