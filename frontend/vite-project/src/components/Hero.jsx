import React, { useState } from "react";
import {
  getStoredUser,
  authenticateWallet,
  isMobileDevice,
  redirectToMetaMaskOrStore,
} from "../services/auth";
import MobileWalletModal from "./MobileWalletModal";

function Hero({ onAuthenticated }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartMinting = async () => {
    const user = getStoredUser();
    if (user) {
      onAuthenticated?.();
      return;
    }

    if (!window.ethereum && isMobileDevice()) {
      setShowModal(true);
      redirectToMetaMaskOrStore();
      return;
    }

    setLoading(true);
    try {
      await authenticateWallet();
      onAuthenticated?.();
    } catch {
      if (isMobileDevice() && !window.ethereum) {
        setShowModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1>AuthArt</h1>

        <h2>
          Authenticity Secured.
          <br />
          Ownership Assured.
        </h2>

        <p>
          The next generation AI-powered NFT authenticity verification
          ecosystem.
        </p>

        <button
          className="hero-btn"
          onClick={handleStartMinting}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Start Minting"}
        </button>
      </div>

      <div className="hero-bg"></div>
      <MobileWalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </section>
  );
}

export default Hero;
