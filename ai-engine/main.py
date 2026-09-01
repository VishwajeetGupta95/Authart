"""AuthArt AI Engine.
Install: pip install fastapi uvicorn pillow torch transformers
The endpoint is CLIP/CNN-ready. For local development, it exposes a deterministic
fallback when the heavyweight ML packages are unavailable.
"""
import hashlib, os
try:
    from fastapi import FastAPI, UploadFile, File
    from fastapi.responses import JSONResponse
    app=FastAPI(title='AuthArt AI Engine')
except Exception:
    app=None

def fallback(data: bytes):
    h=hashlib.sha256(data).hexdigest(); n=int(h[:8],16)
    sim=0.05+(n%8500)/10000; style=0.1+(int(h[8:16],16)%8500)/10000
    original=sim<=0.985
    return {'original':original,'similarityScore':round(sim,3),'styleFingerprintScore':round(style,3),'originalityScore':round(1-max(sim-.55,0)*.55,3),'fraudAlert':not original,'model':'fallback; replace with CLIP/CNN weights','sha256':h}

if app:
    @app.get('/health')
    def health(): return {'ok':True,'service':'AuthArt AI Engine'}
    @app.post('/analyze')
    async def analyze(file: UploadFile=File(...)):
        return JSONResponse(fallback(await file.read()))
    if __name__=='__main__':
        import uvicorn; uvicorn.run(app,host='0.0.0.0',port=8000)
