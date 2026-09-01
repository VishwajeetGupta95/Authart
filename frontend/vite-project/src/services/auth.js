import { BrowserProvider } from "ethers";

function resolveApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:5000/api";
  let clean = envUrl.trim().replace(/\/+$/, "");
  if (!clean.endsWith("/api")) clean = `${clean}/api`;
  return clean;
}

export const API_URL = resolveApiUrl();
const TOKEN_KEY = "authart_jwt";
const USER_KEY = "authart_user";

export function getStoredToken() { return localStorage.getItem(TOKEN_KEY); }
export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}
export function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

async function api(path, options = {}) {
  const url = `${API_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (err) {
    if (url.includes("localhost")) {
      throw new Error(`Cannot reach backend: frontend is trying to connect to '${url}'. Please add the VITE_API_URL environment variable to your Vercel project with your deployed backend URL.`);
    }
    throw new Error(`Cannot reach backend at '${url}'. Please verify your backend service is running and CORS is enabled. (${err.message})`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const METAMASK_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=io.metamask";
export const METAMASK_APP_STORE_URL = "https://apps.apple.com/app/metamask/id1438144202";

export function getMobileOS() {
  if (typeof window === "undefined" || !navigator) return null;
  const ua = (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return null;
}

export function isMobileDevice() {
  return getMobileOS() !== null;
}

export function getMetaMaskDeepLink(url) {
  const target = url || (typeof window !== "undefined" ? window.location.href : "");
  const cleanTarget = target.replace(/^https?:\/\//i, "");
  return `https://metamask.app.link/dapp/${cleanTarget}`;
}

export function redirectToMetaMaskOrStore() {
  if (typeof window === "undefined") return;
  const deepLink = getMetaMaskDeepLink();
  // Open MetaMask Mobile Universal Link:
  // If installed, launches MetaMask in-app browser.
  // If not installed, automatically navigates to Play Store (Android) or App Store (iOS).
  window.location.href = deepLink;
}

export async function authenticateWallet() {
  if (!window.ethereum) {
    if (isMobileDevice()) {
      redirectToMetaMaskOrStore();
      throw new Error("Redirecting to MetaMask Mobile app...");
    }
    throw new Error("MetaMask is not installed. Please install the MetaMask extension.");
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const challenge = await api("/auth/nonce", {
    method: "POST",
    body: JSON.stringify({ address }),
  });

  const signature = await signer.signMessage(challenge.message);

  const result = await api("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ address, signature }),
  });

  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result;
}

export async function restoreSession() {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const result = await api("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return result.user;
  } catch {
    logout();
    return null;
  }
}
