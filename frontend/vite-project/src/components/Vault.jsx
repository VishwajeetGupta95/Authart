function Vault() {
  return (
    <section className="vault">
      <div className="vault-header">
        <h2 className="vault-title">THE DIGITAL VAULT INFRASTRUCTURE</h2>

        <p className="vault-desc">
          AuthArt architecture ensures radical transparency and industrial-grade
          NFT security.
        </p>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-num">01.</div>
          <h3 className="card-title">AI ORIGINALITY GUARD</h3>
          <p className="card-body">
            Every artwork is scanned using AI similarity detection.
          </p>
        </div>

        <div className="card">
          <div className="card-num">02.</div>
          <h3 className="card-title">CROSS-CHAIN OWNERSHIP</h3>
          <p className="card-body">
            Transfer NFTs across multiple blockchains.
          </p>
        </div>

        <div className="card">
          <div className="card-num">03.</div>
          <h3 className="card-title">ZERO-KNOWLEDGE PROOFS</h3>
          <p className="card-body">
            Verify NFT ownership privately using zk proofs.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Vault;
