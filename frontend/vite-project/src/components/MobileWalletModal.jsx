import React from "react";
import {
  getMobileOS,
  getMetaMaskDeepLink,
  METAMASK_PLAY_STORE_URL,
  METAMASK_APP_STORE_URL,
} from "../services/auth";

function MobileWalletModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const os = getMobileOS();
  const deepLink = getMetaMaskDeepLink();
  const storeUrl = os === "ios" ? METAMASK_APP_STORE_URL : METAMASK_PLAY_STORE_URL;
  const storeName = os === "ios" ? "Apple App Store" : "Google Play Store";

  const handleOpenApp = () => {
    window.location.href = deepLink;
  };

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-modal-handle" />
        
        <div className="mobile-modal-icon">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <path d="M28.78 1.48L17.75 9.77l2.03-4.83L28.78 1.48z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5"/>
            <path d="M3.22 1.48l10.93 8.35L12.22 5 3.22 1.48z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
            <path d="M24.77 22.09l-3.03 4.65 6.36 1.75 1.83-6.28-5.16-.12z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
            <path d="M2.07 22.21l1.82 6.28 6.36-1.75-3.03-4.65-5.15.12z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
            <path d="M9.82 14.1l-1.8 2.73 6.44.29-.24-6.95L9.82 14.1z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
            <path d="M22.18 14.1l-4.43-3.93-.2 6.95 6.43-.29-1.8-2.73z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
            <path d="M10.25 26.74l3.86-1.88-3.33-2.6-0.53 4.48z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
            <path d="M17.89 24.86l3.86 1.88-.53-4.48-3.33 2.6z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
            <path d="M14.11 24.86l1.89 4.36 1.89-4.36-3.78 0z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5"/>
            <path d="M21.75 22.26l-3.86-2.6-3.89 2.6 3.89 2.6 3.86-2.6z" fill="#233447" stroke="#233447" strokeWidth="0.5"/>
          </svg>
        </div>

        <h3>Connect with MetaMask</h3>
        <p className="mobile-modal-desc">
          To authenticate your creator identity on mobile, open AuthArt inside the MetaMask app's built-in Web3 browser.
        </p>

        <div className="mobile-modal-actions">
          <button className="mobile-modal-btn primary" onClick={handleOpenApp}>
            🦊 Open in MetaMask App
          </button>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-modal-btn secondary"
          >
            📲 Install from {storeName}
          </a>
        </div>

        <button className="mobile-modal-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default MobileWalletModal;
