import { API_URL } from './auth';

const token = () => localStorage.getItem('authart_jwt');

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const jwt = token();
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const url = `${API_URL}${path}`;
  let r;
  try {
    r = await fetch(url, { ...options, headers });
  } catch (err) {
    if (url.includes('localhost')) {
      throw new Error(`Cannot reach backend: frontend is trying to connect to '${url}'. Please add the VITE_API_URL environment variable to your Vercel project.`);
    }
    throw new Error(`Cannot reach backend at '${url}'. Please check if your backend service is running. (${err.message})`);
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

export function getApiUrl() { return API_URL; }
export function getMyArtworks(){return request('/artworks');}
export function uploadArtwork(fd){return request('/artworks/upload',{method:'POST',body:fd});}
export function analyzeArtwork(id){return request(`/artworks/${id}/analyze`,{method:'POST'});}
export function mintArtwork(id){return request(`/artworks/${id}/mint`,{method:'POST'});}
