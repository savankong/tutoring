import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { INVITE_REWARD_CREDITS } from '../lib/plans.js';

// Shared by both the Account page's persistent "Invite friends" card and
// InviteFriendsModal.jsx's first-time popup, so the link/QR/copy behavior
// never drifts between the two places it appears.
function InviteShareBlock({ user }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  const inviteUrl = `${window.location.origin}/register?invited_by=${user.invite_code}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(inviteUrl, { margin: 1, width: 140 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        // No QR code is a fine fallback — the link itself still works.
      });
    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // Clipboard API unavailable or denied — the link is still visible and
      // selectable in the input below, so they can copy it by hand.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    try {
      await navigator.share({ title: 'Join me on Cambo', url: inviteUrl });
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
  };

  return (
    <div className="invite-share-block">
      <div className="invite-share-row">
        {qrDataUrl && <img src={qrDataUrl} alt="Invite QR code" className="invite-qr" width={110} height={110} />}
        <div className="invite-share-link-col">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            onFocus={(e) => e.target.select()}
            className="invite-link-input"
          />
          <div className="actions account-card-actions">
            {canShare && (
              <button type="button" className="pill-button pill-button-sm" onClick={shareLink}>
                Share invite link
              </button>
            )}
            <button
              type="button"
              className={`pill-button pill-button-sm${canShare ? ' pill-button-outline' : ''}`}
              onClick={copyLink}
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
      {user.invited_friends_count > 0 && (
        <div className="account-card-sub invite-share-count">
          {user.invited_friends_count} friend{user.invited_friends_count === 1 ? '' : 's'} joined so far —{' '}
          {user.invited_friends_count * INVITE_REWARD_CREDITS} bonus captures earned.
        </div>
      )}
    </div>
  );
}

export default InviteShareBlock;
