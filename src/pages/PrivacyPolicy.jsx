import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Seo from '../components/Seo.jsx';
import ZineHeader from '../components/zine/ZineHeader.jsx';
import ZineResources from '../components/zine/ZineResources.jsx';
import '../styles/zine.css';

const LAST_UPDATED = 'August 29, 2026';

function PrivacyPolicy() {
  const { user } = useAuthContext();

  return (
    <div className="zn-root">
      <Seo
        title="Privacy Policy — Cambo App"
        description="How Cambo collects, uses, and protects your information."
        path="/privacy"
      />
      <div className="zn-grain" />
      <ZineHeader user={user} />

      <div className="zn-legal-head">
        <span className="zn-tag">Privacy Policy</span>
        <h1>Privacy Policy</h1>
        <p>Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="zn-legal-content">
            <p>
              Cambo ("Cambo", "we", "us") provides a camera-based tool that lets tutors
              and students photograph a practice question and get an answer back. This
              policy explains what information we collect through camboapp.com and the
              Cambo app, and how we use it.
            </p>

            <h2>Information we collect</h2>
            <p>
              <strong>Account information.</strong> When you create an account, we collect
              your email address and, if you sign in with Google, the basic profile
              information Google shares with us (name, email address, profile photo).
            </p>
            <p>
              <strong>Captures.</strong> When you use Cambo to photograph a question, the
              image and the resulting answer are sent to our servers and to the
              third-party AI providers we use to generate answers, so that we can return
              a response and keep a history of your captures inside your account.
            </p>
            <p>
              <strong>Billing information.</strong> If you subscribe to a paid plan,
              payment is handled by Stripe. We do not store your card number — Stripe
              provides us with a billing status and subscription identifiers.
            </p>
            <p>
              <strong>Usage information.</strong> We collect basic technical information
              (such as device type and general usage patterns) to keep the service
              reliable and to understand which features are used.
            </p>

            <h2>How we use information</h2>
            <p>We use the information above to:</p>
            <ul>
              <li>Provide the core capture-and-answer functionality of Cambo;</li>
              <li>Create and maintain your account and capture history;</li>
              <li>Process payments and manage subscriptions;</li>
              <li>Send account-related email (verification, password reset, receipts);</li>
              <li>Maintain the security and reliability of the service;</li>
              <li>Respond to support questions you send us.</li>
            </ul>

            <h2>Sharing</h2>
            <p>We share information only with the service providers that help us run Cambo:</p>
            <ul>
              <li>AI providers, to generate answers from captured questions;</li>
              <li>Stripe, to process payments;</li>
              <li>Our email provider, to send account-related email;</li>
              <li>Our hosting and database providers, to run the service.</li>
            </ul>
            <p>
              We do not sell your personal information, and we do not share your captures
              or account information with other users.
            </p>

            <h2>Google Sign-In</h2>
            <p>
              If you choose to sign in with Google, Cambo requests only your basic Google
              account information (name, email address, profile photo) to create and
              authenticate your account. We do not request access to your Gmail, Drive,
              contacts, or any other Google data.
            </p>

            <h2>Data retention</h2>
            <p>
              We retain your account information and capture history for as long as your
              account is active. You can request deletion of your account and associated
              data at any time by contacting us.
            </p>

            <h2>Your choices</h2>
            <p>
              You can review and update your account information from your Account page,
              and you can cancel a paid subscription at any time. To request deletion of
              your account, contact us using the details below.
            </p>

            <h2>Children's privacy</h2>
            <p>
              Cambo is intended for use by tutors and students under the supervision of a
              tutor or guardian. We do not knowingly collect personal information from
              children in a way that falls outside of that supervised use.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will update the "Last
              updated" date above when we do.
            </p>

            <h2>Contact us</h2>
            <p>
              Questions about this policy? Email us at <a href="mailto:camboapp101@gmail.com">camboapp101@gmail.com</a>.
            </p>
      </div>

      <ZineResources />

      <footer className="zn-footer">
        <div>
          <div className="zn-footer-wordmark">Cambo</div>
          <div className="zn-footer-sub">© 2026 · Still not an app for cheating</div>
        </div>
        <nav className="zn-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/terms">Terms of Service</Link>
        </nav>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
