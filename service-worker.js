self.addEventListener('install',e=>{e.waitUntil(caches.open('v2')
 .then(c=>c.add(['./index.html','./style.css','./logic.js','./auto.js','./markets.js','./value.js','./app.js','./manifest.json'])))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
