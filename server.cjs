const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
http.createServer((req,res) => {
 let pathname;
 try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
 const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
 if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
 fs.readFile(file,(err,data) => {
  if(err){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[path.extname(file)] || 'application/octet-stream');
  res.end(data);
 });
}).listen(3001,'127.0.0.1',()=>console.log('Study Space: http://localhost:3001'));
