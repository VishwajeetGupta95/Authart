const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { analyzeArtwork } = require('../services/ai');
const { mintIfConfigured } = require('../services/blockchain');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
const artworkFile = path.join(__dirname, '..', 'data', 'artworks.json');
fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(artworkFile)) fs.writeFileSync(artworkFile, '[]');
const storage = multer.diskStorage({ destination: (_req,_file,cb)=>cb(null,uploadDir), filename: (_req,file,cb)=>cb(null,`${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({ storage, limits:{fileSize:10*1024*1024}, fileFilter:(_req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)) });
function read(){ try{return JSON.parse(fs.readFileSync(artworkFile,'utf8'));}catch{return [];} }
function save(x){fs.writeFileSync(artworkFile,JSON.stringify(x,null,2));}
router.get('/',(req,res)=>res.json({artworks:read().filter(x=>x.ownerAddress.toLowerCase()===req.user.address.toLowerCase())}));
router.post('/upload',upload.single('artwork'),(req,res)=>{
 if(!req.file)return res.status(400).json({error:'Please upload a PNG, JPG, WEBP, or GIF image.'});
 const title=String(req.body.title||'').trim(); if(!title){fs.unlinkSync(req.file.path);return res.status(400).json({error:'Artwork title is required.'});}
 const item={id:crypto.randomUUID(),title,description:String(req.body.description||'').trim(),originalName:req.file.originalname,filename:req.file.filename,mimeType:req.file.mimetype,size:req.file.size,ownerAddress:req.user.address,did:req.user.did,status:'uploaded',aiStatus:'pending',createdAt:new Date().toISOString()};
 const all=read();all.unshift(item);save(all);res.status(201).json({artwork:item});
});
router.post('/:id/analyze',async(req,res)=>{try{const all=read(),i=all.findIndex(x=>x.id===req.params.id&&x.ownerAddress.toLowerCase()===req.user.address.toLowerCase());if(i<0)return res.status(404).json({error:'Artwork not found'});const a=await analyzeArtwork(path.join(uploadDir,all[i].filename));all[i]={...all[i],aiStatus:a.original?'passed':'failed',aiResult:a};save(all);res.json({artwork:all[i]});}catch(e){res.status(500).json({error:e.message});}});
router.post('/:id/mint',async(req,res)=>{try{const all=read(),i=all.findIndex(x=>x.id===req.params.id&&x.ownerAddress.toLowerCase()===req.user.address.toLowerCase());if(i<0)return res.status(404).json({error:'Artwork not found'});const a=all[i];if(a.aiStatus!=='passed')return res.status(400).json({error:'Artwork must pass the AI originality check before minting.'});const metadataDir=path.join(__dirname,'..','data','metadata'); fs.mkdirSync(metadataDir,{recursive:true}); const metadata={name:a.title,description:a.description,image:`/uploads/${a.filename}`,creator:a.did,attributes:[{trait_type:'AI originality',value:a.aiResult.originalityScore}]}; fs.writeFileSync(path.join(metadataDir,`${a.id}.json`),JSON.stringify(metadata,null,2)); const metadataUri=`local://metadata/${a.id}`; const chain=await mintIfConfigured({ownerAddress:a.ownerAddress,metadataUri,royaltyBps:500}); const result=chain||{tokenId:String(Date.now()),network:'Local Demo Chain',contractAddress:'demo-contract',metadataUri,royaltyBps:500};all[i]={...a,status:'minted',mint:result};save(all);res.json({artwork:all[i],mint:result});}catch(e){res.status(500).json({error:e.message});}});
router.get('/file/:filename',(req,res)=>{const f=path.join(uploadDir,path.basename(req.params.filename));if(!fs.existsSync(f))return res.status(404).end();res.sendFile(f);});
module.exports=router;
