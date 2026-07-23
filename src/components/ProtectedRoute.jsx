import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from './Logo.jsx';

// Netlify Functions cold starts can push the initial /.netlify/functions/me
// auth check out 1-3+ seconds. Rendering nothing during that window reads
// as a blank white screen on every fresh load of a protected route — this
// gives first paint something real instead of gating it on the network call.
function AuthLoading() {
  return (
    <div className="auth-loading">
      <Logo size={26} wordmark />
      <span className="thinking-spinner" />
    </div>
  );
}

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthContext();

  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/app" replace />;

  return children;
}
