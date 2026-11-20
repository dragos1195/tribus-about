/* Lets the site install as an app. Always tries the network first so your
   latest changes show up; falls back to the last saved copy when offline.
   The theme song is saved in full at install, and slices of it are served
   from that copy when the phone asks for part of it while offline. */
var CACHE = 'surprise-v3';
var SONG = 'surprise/theme.mp3';
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.add(SONG); }).catch(function () {}));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function fromCache(req) {
  return caches.match(req.url, { ignoreSearch: true }).then(function (res) {
    var range = req.headers.get('range');
    if (!res || !range) return res;
    return res.arrayBuffer().then(function (buf) {
      var m = /bytes=(\d*)-(\d*)/.exec(range) || [];
      var start = m[1] ? +m[1] : 0, end = m[2] ? +m[2] : buf.byteLength - 1;
      end = Math.min(end, buf.byteLength - 1);
      return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
        'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.byteLength,
        'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
    });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.status === 200) {   // partial (206) answers are not saved
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () { return fromCache(req); }));
});
