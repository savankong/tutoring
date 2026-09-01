import { useState } from 'react';
import { useAuthContext } from '../lib/AuthContext.jsx';
import InviteShareBlock from './InviteShareBlock.jsx';
import { INVITE_REWARD_CREDITS } from '../lib/plans.js';

// Shown exactly once, right after a user first lands on /app — invite_modal_seen
// is tracked server-side (see me.js / mark-invite-modal-seen.js), not in
// localStorage, so it stays dismissed across devices instead of reappearing
// on a new browser. Reuses the same .modal-overlay/.modal-card shell as
// Account.jsx's credit-purchase modal.
function InviteFriendsModal() {
  const { user, refresh } = useAuthContext();
  const [dismissing, setDismissing] = useState(false);

  if (!user || user.invite_modal_seen) return null;

  const dismiss = async () => {
    if (dismissing) return;
    setDismissing(true);
    try {
      await fetch('/api/mark-invite-modal-seen', { method: 'POST', credentials: 'include' });
    } catch {
      // Best-effort — worst case they see the popup once more next load.
    }
    await refresh();
  };

  return (
    <div className="modal-overlay" onClick={dismiss}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Invite your friends</h3>
        <p className="account-card-sub">
          Share Cambo with a friend. Once they join, you get {INVITE_REWARD_CREDITS} bonus captures — no
          expiration, on top of whatever plan you're on.
        </p>
        <InviteShareBlock user={user} />
        <div className="actions account-card-actions">
          <button
            type="button"
            className="pill-button pill-button-sm pill-button-outline"
            onClick={dismiss}
            disabled={dismissing}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteFriendsModal;
