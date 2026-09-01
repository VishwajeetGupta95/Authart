import React, { useEffect, useState } from "react";
import {
  authenticateWallet,
  getStoredUser,
  logout,
  restoreSession,
  isMobileDevice,
  redirectToMetaMaskOrStore,
} from "../services/auth";
import MobileWalletModal from "./MobileWalletModal";

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "CONNECT WALLET";
}

function Navbar({ onAuthenticated }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    restoreSession().then(setUser);

    if (!window.ethereum) return undefined;
    const handleAccountsChanged = () => {
      logout();
      setUser(null);
      setError("");
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum && isMobileDevice()) {
      setShowMobileModal(true);
      redirectToMetaMaskOrStore();
      return;
    }
    setLoading(true);
    try {
      const result = await authenticateWallet();
      setUser(result.user);
      onAuthenticated?.();
    } catch (err) {
      if (isMobileDevice() && !window.ethereum) {
        setShowMobileModal(true);
      } else {
        setError(err.message || "Wallet authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <>
      <nav className="nav">
        <a className="nav-logo">AuthArt</a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>
                {shortAddress(user.address)}
              </span>
              <button className="nav-connect" onClick={handleLogout}>LOGOUT</button>
            </>
          ) : (
            <button className="nav-connect" onClick={connectWallet} disabled={loading}>
              {loading ? "SIGNING..." : "CONNECT WALLET"}
            </button>
          )}
        </div>
      </nav>
      {error && (
        <div style={{ position: "fixed", top: 72, right: 24, zIndex: 20, maxWidth: 360, padding: "12px 16px", borderRadius: 10, background: "#3b1020", color: "#fecdd3", border: "1px solid #9f1239" }}>
          {error}
        </div>
      )}
      <MobileWalletModal isOpen={showMobileModal} onClose={() => setShowMobileModal(false)} />
    </>
  );
}

export default Navbar;
