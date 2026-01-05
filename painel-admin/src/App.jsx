import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BuscarCliente from './pages/BuscarCliente';
import RegistrarPagamento from './pages/RegistrarPagamento';
import ListarAssinaturas from './pages/ListarAssinaturas';
import DetalhesAssinatura from './pages/DetalhesAssinatura';
import Planos from './pages/Planos';
import AcompanhamentoFlow from './pages/AcompanhamentoFlow';
import Agendamentos from './pages/Agendamentos';
import Relatorios from './pages/Relatorios';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/buscar"
          element={
            <ProtectedRoute>
              <BuscarCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagamentos/registrar"
          element={
            <ProtectedRoute>
              <RegistrarPagamento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assinaturas"
          element={
            <ProtectedRoute>
              <ListarAssinaturas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assinaturas/:id"
          element={
            <ProtectedRoute>
              <DetalhesAssinatura />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <Planos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flow/acompanhamento"
          element={
            <ProtectedRoute>
              <AcompanhamentoFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agendamentos"
          element={
            <ProtectedRoute>
              <Agendamentos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <Relatorios />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
