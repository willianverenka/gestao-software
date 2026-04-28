import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';

function LoadingState({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Verificando acesso..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function GuestOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Carregando acesso..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PatientRegistrationGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Carregando cadastro..." />;
  }

  if (user && user.role !== 'secretaria') {
    return <Navigate to="/" replace />;
  }

  if (user?.role === 'secretaria') {
    return <AppShell>{children}</AppShell>;
  }

  return children;
}
