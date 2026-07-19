import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthContext();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
