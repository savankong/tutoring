import { Route, Routes } from 'react-router-dom';
import HardReloadFallback from './components/HardReloadFallback.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';
import AdminQuestions from './pages/AdminQuestions.jsx';
import AdminSubmissions from './pages/AdminSubmissions.jsx';
import Capture from './pages/Capture.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import History from './pages/History.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Pricing from './pages/Pricing.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import Register from './pages/Register.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import './App.css';
// zine-lp.css styles the 24 SEO campaign pages (src/landing-pages/), which
// render via renderToStaticMarkup and are never part of this client bundle's
// component tree — so nothing here actually reaches LandingPageTemplate.jsx.
// This import exists solely so the rule set lands in the compiled stylesheet
// (dist/assets/index-*.css), which scripts/build-landing-pages.mjs reuses
// verbatim as those pages' <link> tag. Same trick App.css already relies on
// for its shared classes. Don't remove this thinking it's dead — it isn't.
import './styles/zine-lp.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
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
      <Route
        path="/admin/questions"
        element={
          <ProtectedRoute adminOnly>
            <AdminQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/submissions"
        element={
          <ProtectedRoute adminOnly>
            <AdminSubmissions />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HardReloadFallback />} />
    </Routes>
  );
}

export default App;
