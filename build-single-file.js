/* build-single-file.js — bundles the app into one self-contained HTML file.
   Used to publish a hosted copy someone can open without setting up hosting.
   Run: node build-single-file.js [outfile]
   The multi-file version in this folder stays the source of truth; this is a
   build output, not a second copy to maintain. */

var fs = require('fs');
var path = require('path');

var here = __dirname;
var read = function (p) { return fs.readFileSync(path.join(here, p), 'utf8'); };

var html = read('index.html');
var css = read('assets/css/app.css');
var scripts = ['data', 'store', 'ui', 'routines', 'calm', 'settings', 'app']
  .map(function (n) { return read('assets/js/' + n + '.js'); });

// The single-file build has no separate sw.js to register.
scripts[6] = scripts[6].replace(
  /if \('serviceWorker' in navigator[\s\S]*?\}\n/,
  '// (no service worker in the single-file build)\n'
);

// Body markup only: the host page supplies doctype, <head> and <body>.
var body = html.split('<body>')[1].split('</body>')[0];
body = body.replace(/\n\s*<script src="assets\/js\/[a-z]+\.js"><\/script>/g, '');

// The logo has to travel inside the one-file build, so inline it.
var logo = fs.readFileSync(path.join(here, 'assets/icons/icon-192.png')).toString('base64');
body = body.replace('src="assets/icons/icon-192.png"', 'src="data:image/png;base64,' + logo + '"');

// Icon links and the manifest do not apply to a one-file build.
var out = [
  '<title>Andi\'s Day</title>',
  '<style>\n' + css + '\n</style>',
  body.trim(),
  '<script>\n' + scripts.join('\n\n/* ---- */\n\n') + '\n</script>'
].join('\n\n');

var target = process.argv[2] || path.join(here, 'andis-day-single-file.html');
fs.writeFileSync(target, out);
console.log('wrote ' + target + ' (' + Math.round(out.length / 1024) + ' KB)');
