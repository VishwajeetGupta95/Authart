import React, { useEffect, useState } from 'react';
import { getStoredUser } from '../services/auth';
import {
  getMyArtworks,
  getApiUrl,
  uploadArtwork,
  analyzeArtwork,
  mintArtwork,
  getMarketplaceListings,
  listArtworkOnMarketplace,
  buyMarketplaceListing,
} from '../services/api';

const tabs = ['Upload Artwork', 'Marketplace', 'Edit Profile'];

function getArtworkImageUrl(artwork) {
  if (artwork?.imageGatewayUrl) return artwork.imageGatewayUrl;
  if (artwork?.imageUri?.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${artwork.imageUri.slice(7)}`;
  }
  if (!artwork?.filename) return '';
  const backendUrl = getApiUrl().replace(/\/api\/?$/, '');
  return `${backendUrl}/uploads/${encodeURIComponent(artwork.filename)}`;
}

function Dashboard({ onLogout }) {
  const [active, setActive] = useState('Upload Artwork');
  const [user] = useState(getStoredUser());
  const [artworks, setArtworks] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', artwork: null });
  const [listingPrice, setListingPrice] = useState({});
  const [marketQuery, setMarketQuery] = useState('');
  const [marketSort, setMarketSort] = useState('newest');

  const refreshData = async () => {
    setLoading(true);
    try {
      const artRes = await getMyArtworks();
      setArtworks(artRes.artworks || []);
      const marketRes = await getMarketplaceListings();
      setListings(marketRes.listings || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const run = async (id, fn, successMsg) => {
    setBusy(id);
    setError('');
    setMessage('');
    try {
      const res = await fn(id);
      setArtworks((prev) => prev.map((x) => (x.id === id ? res.artwork : x)));
      setMessage(successMsg);
      refreshData();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.artwork) return setError('Choose an artwork image first.');
    setBusy('upload');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('artwork', form.artwork);
      const res = await uploadArtwork(fd);
      setArtworks((prev) => [res.artwork, ...prev]);
      setForm({ title: '', description: '', artwork: null });
      e.target.reset();
      setMessage('Artwork uploaded successfully. Run the AI originality check next.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleListForSale = async (artworkId) => {
    const price = listingPrice[artworkId];
    if (!price || Number(price) <= 0) {
      return setError('Please enter a valid price in ETH to list.');
    }
    setBusy(`list-${artworkId}`);
    setError('');
    setMessage('');
    try {
      await listArtworkOnMarketplace(artworkId, price);
      setMessage(`Artwork listed on marketplace for ${price} ETH!`);
      refreshData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleBuy = async (listingId) => {
    setBusy(`buy-${listingId}`);
    setError('');
    setMessage('');
    try {
      await buyMarketplaceListing(listingId);
      setMessage('Artwork purchased successfully! Ownership transferred.');
      refreshData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const visibleListings = listings
    .filter((listing) => {
      const query = marketQuery.trim().toLowerCase();
      if (!query) return true;
      const title = listing.artwork?.title || '';
      const seller = listing.sellerAddress || '';
      return `${title} ${seller}`.toLowerCase().includes(query);
    })
    .sort((first, second) => {
      if (marketSort === 'price-low') return Number(first.priceEth) - Number(second.priceEth);
      if (marketSort === 'price-high') return Number(second.priceEth) - Number(first.priceEth);
      if (marketSort === 'originality') {
        return (second.artwork?.aiResult?.originalityScore || 0) - (first.artwork?.aiResult?.originalityScore || 0);
      }
      return new Date(second.listedAt || 0) - new Date(first.listedAt || 0);
    });

  return (
    <main className="dashboard">
      <div className="dashboard-nav">
        <strong>AuthArt</strong>
        <span>
          {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
        </span>
        <button onClick={onLogout}>LOGOUT</button>
      </div>

      <section className="dashboard-head">
        <div>
          <span className="eyebrow">AUTHART CREATOR STUDIO</span>
          <h1>Your creative vault & marketplace.</h1>
          <p>Identity, AI originality verification, minting and marketplace trading.</p>
        </div>
        <div className="identity">
          <span>DID</span>
          <strong>{user?.did}</strong>
        </div>
      </section>

      <div className="dashboard-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={active === t ? 'active' : ''}
            onClick={() => {
              setActive(t);
              setMessage('');
              setError('');
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      {active === 'Upload Artwork' && (
        <>
          <section className="dashboard-grid">
            <form className="panel upload-panel" onSubmit={handleUpload}>
              <div className="panel-title">
                <span>01</span>
                <div>
                  <h2>Upload Artwork</h2>
                  <p>Upload digital art for dual-model AI originality verification.</p>
                </div>
              </div>
              <label>
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="dropzone">
                <input
                  required
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setForm({ ...form, artwork: e.target.files?.[0] || null })}
                />
                <span>
                  Drop image here or <b>browse</b>
                </span>
                <small>PNG, JPG, WEBP or GIF · max 10 MB</small>
              </label>
              <button className="primary-btn" disabled={busy === 'upload'}>
                {busy === 'upload' ? 'UPLOADING...' : 'UPLOAD FOR AI CHECK'}
              </button>
            </form>

            <section className="panel pipeline-panel">
              <div className="panel-title">
                <span>02</span>
                <div>
                  <h2>AI & Blockchain Pipeline</h2>
                  <p>Each phase unlocks the subsequent step.</p>
                </div>
              </div>
              <div className="pipeline">
                <div className="pipeline-step current">
                  <b>Upload</b>
                  <small>Phase 2</small>
                </div>
                <div className="pipeline-line" />
                <div className="pipeline-step">
                  <b>AI Originality</b>
                  <small>Phase 3</small>
                </div>
                <div className="pipeline-line" />
                <div className="pipeline-step">
                  <b>Mint & Royalties</b>
                  <small>Phase 4</small>
                </div>
                <div className="pipeline-line" />
                <div className="pipeline-step">
                  <b>Marketplace</b>
                  <small>Phase 5</small>
                </div>
              </div>
            </section>
          </section>

          <section className="panel collection">
            <div className="collection-head">
              <div>
                <h2>My Artworks</h2>
                <p>
                  {artworks.length} uploaded piece{artworks.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            {loading ? (
              <p>Loading your gallery...</p>
            ) : artworks.length === 0 ? (
              <div className="empty">No artworks uploaded yet.</div>
            ) : (
              <div className="art-grid">
                {artworks.map((x) => (
                  <article className="art-card" key={x.id}>
                    <img
                      src={getArtworkImageUrl(x)}
                      alt={x.title}
                    />
                    <div>
                      <h3>{x.title}</h3>
                      <span
                        className={`badge ${
                          x.aiStatus === 'passed'
                            ? 'badge-passed'
                            : x.aiStatus === 'failed'
                            ? 'badge-failed'
                            : 'badge-pending'
                        }`}
                      >
                        {x.aiStatus === 'pending'
                          ? 'AI CHECK PENDING'
                          : x.aiStatus === 'passed'
                          ? 'AI VERIFIED'
                          : 'FRAUD / DUPLICATE'}
                      </span>
                      {x.aiResult && (
                        <small>
                          Originality {Math.round(x.aiResult.originalityScore * 100)}% · Est.{' '}
                          {x.aiResult.pricePrediction?.suggestedEth || '-'} ETH
                        </small>
                      )}
                      {x.metadataGatewayUrl && (
                        <a className="metadata-link" href={x.metadataGatewayUrl} target="_blank" rel="noreferrer">
                          VIEW IPFS METADATA
                        </a>
                      )}
                      <div className="card-actions">
                        {x.aiStatus === 'pending' && (
                          <button onClick={() => run(x.id, analyzeArtwork, 'AI analysis completed.')}>
                            {busy === x.id ? 'SCANNING...' : 'RUN AI CHECK'}
                          </button>
                        )}
                        {x.aiStatus === 'passed' && x.status !== 'minted' && (
                          <button onClick={() => run(x.id, mintArtwork, 'NFT minted successfully.')}>
                            {busy === x.id ? 'MINTING...' : 'MINT NFT'}
                          </button>
                        )}
                        {x.status === 'minted' && (
                          <div className="minted-actions">
                            <b className="minted">MINTED · #{x.mint?.tokenId}</b>
                            <div className="list-controls">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="ETH"
                                value={listingPrice[x.id] || ''}
                                onChange={(e) =>
                                  setListingPrice({ ...listingPrice, [x.id]: e.target.value })
                                }
                              />
                              <button
                                className="list-btn"
                                disabled={busy === `list-${x.id}`}
                                onClick={() => handleListForSale(x.id)}
                              >
                                {busy === `list-${x.id}` ? 'LISTING...' : 'LIST FOR SALE'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {active === 'Marketplace' && (
        <section className="panel marketplace-panel">
          <div className="collection-head">
            <div>
              <span className="section-kicker">COLLECTOR EDITION</span>
              <h2>NFT Marketplace</h2>
              <p>Discover AI-verified authentic digital artworks from verified creators.</p>
            </div>
            <div className="marketplace-stats">
              <strong>{listings.length}</strong>
              <span>active listings</span>
            </div>
          </div>
          {loading ? (
            <p>Loading marketplace...</p>
          ) : listings.length === 0 ? (
            <div className="empty marketplace-empty">
              <strong>The market is waiting for its first drop.</strong>
              <span>Mint an AI-verified artwork, then list it from your collection.</span>
            </div>
          ) : (
            <>
              <div className="marketplace-toolbar">
                <label className="market-search">
                  <span>Search collection</span>
                  <input
                    type="search"
                    placeholder="Title or wallet address"
                    value={marketQuery}
                    onChange={(e) => setMarketQuery(e.target.value)}
                  />
                </label>
                <label className="market-sort">
                  <span>Sort by</span>
                  <select value={marketSort} onChange={(e) => setMarketSort(e.target.value)}>
                    <option value="newest">Recently listed</option>
                    <option value="originality">Highest originality</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              </div>
              {visibleListings.length === 0 ? (
                <div className="empty marketplace-empty">No listings match your search.</div>
              ) : (
                <div className="art-grid">
                  {visibleListings.map((l) => (
                <article className="art-card" key={l.id}>
                  {l.artwork?.filename && (
                    <>
                      <img
                        src={getArtworkImageUrl(l.artwork)}
                        alt={l.artwork?.title}
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                          event.currentTarget.nextElementSibling.hidden = false;
                        }}
                      />
                      <span className="image-fallback" hidden>Artwork image unavailable</span>
                    </>
                  )}
                  <div>
                    <h3>{l.artwork?.title || 'NFT Artwork'}</h3>
                    <p className="price-tag">
                      <strong>{l.priceEth} ETH</strong> <small>(${l.priceUSD})</small>
                    </p>
                    <small>Seller: {l.sellerAddress.slice(0, 6)}...{l.sellerAddress.slice(-4)}</small>
                    {l.artwork?.aiResult && (
                      <small className="originality-tag">
                        AI Originality: {Math.round(l.artwork.aiResult.originalityScore * 100)}%
                      </small>
                    )}
                    {l.artwork?.metadataGatewayUrl && (
                      <a className="metadata-link" href={l.artwork.metadataGatewayUrl} target="_blank" rel="noreferrer">
                        VIEW IPFS METADATA
                      </a>
                    )}
                    <div className="card-actions">
                      {l.sellerAddress.toLowerCase() === user?.address?.toLowerCase() ? (
                        <span className="owner-badge">YOUR LISTING</span>
                      ) : (
                        <button
                          className="buy-btn"
                          disabled={busy === `buy-${l.id}`}
                          onClick={() => handleBuy(l.id)}
                        >
                          {busy === `buy-${l.id}` ? 'PROCESSING...' : 'BUY NOW'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {active === 'Edit Profile' && (
        <section className="panel profile-form">
          <span className="big-number">03</span>
          <h2>Edit Profile</h2>
          <label>
            Wallet Address
            <input readOnly value={user?.address || ''} />
          </label>
          <label>
            DID (Decentralized Identity)
            <input readOnly value={user?.did || ''} />
          </label>
          <label>
            Display Name
            <input placeholder="Creator name" />
          </label>
          <label>
            Bio
            <textarea placeholder="Tell collectors about your digital art and style" />
          </label>
          <button
            className="primary-btn"
            onClick={() => setMessage('Profile updated successfully.')}
          >
            SAVE PROFILE
          </button>
        </section>
      )}
    </main>
  );
}

export default Dashboard;
