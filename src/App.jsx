import { Route, Routes } from 'react-router-dom';
import HardReloadFallback from './components/HardReloadFallback.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';
import Capture from './pages/Capture.jsx';
import History from './pages/History.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Pricing from './pages/Pricing.jsx';
import Register from './pages/Register.jsx';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Capture />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HardReloadFallback />} />
    </Routes>
  );
}

export default App;
