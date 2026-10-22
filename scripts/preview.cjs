// Local-only static preview at the same subpath as GitHub Pages.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../out');
const base = '/factory-mios-demo';
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  try {
    let name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(name === base) { res.writeHead(302,{Location:base+'/'});res.end();return; }
    if(!name.startsWith(base+'/')) {res.writeHead(404);res.end();return;}
    let file = path.resolve(root,'.'+name.slice(base.length));
    if(file!==root && !file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    if(fs.existsSync(file) && fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    if(!fs.existsSync(file)) {res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(400);res.end();}
}).listen(3180,'127.0.0.1',()=>console.log('Demo preview: http://127.0.0.1:3180/factory-mios-demo/'));
