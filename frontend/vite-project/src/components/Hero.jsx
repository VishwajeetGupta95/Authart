import React from "react";

function Hero({ onAuthenticated }) {
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

        <button className="hero-btn" onClick={() => onAuthenticated?.()}>Start Minting</button>
      </div>

      <div className="hero-bg"></div>
    </section>
  );
}

export default Hero;
