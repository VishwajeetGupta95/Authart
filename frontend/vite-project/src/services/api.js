const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token=()=>localStorage.getItem('authart_jwt');
async function request(path,options={}){const headers={...(options.headers||{})};const jwt=token();if(jwt)headers.Authorization=`Bearer ${jwt}`;const r=await fetch(`${API_URL}${path}`,{...options,headers});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d;}
export function getApiUrl(){return API_URL;}
export function getMyArtworks(){return request('/artworks');}
export function uploadArtwork(fd){return request('/artworks/upload',{method:'POST',body:fd});}
export function analyzeArtwork(id){return request(`/artworks/${id}/analyze`,{method:'POST'});}
export function mintArtwork(id){return request(`/artworks/${id}/mint`,{method:'POST'});}
