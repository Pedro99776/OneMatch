import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
