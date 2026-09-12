// Re-verifies every reference video still exists and is still public.
//
//   node tools/check-videos.mjs
//
// Exits non-zero if any video has gone. Videos rot — creators delete, go private, or
// get taken down — so this is the thing to run before any release, not a one-off.
//
// What it CANNOT check from Node: whether embedding is still permitted. That needs a
// real player in a browser. oEmbed does return 401 when a video is private or removed,
// which is the far more common failure.

import { VIDEOS } from '../js/videos.js';

const oembed = (id) =>
  'https://www.youtube.com/oembed?url=' +
  encodeURIComponent('https://www.youtube.com/watch?v=' + id) + '&format=json';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let bad = 0;
const rows = [];

for (const [moveId, v] of Object.entries(VIDEOS)) {
  let line;
  try {
    const r = await fetch(oembed(v.id));
    if (!r.ok) {
      bad++;
      line = ['GONE', moveId, v.id, 'HTTP ' + r.status, v.title];
    } else {
      const j = await r.json();
      // A changed title is not a failure, but it is worth seeing — it can mean the
      // creator re-used the id's slot in a playlist, or simply renamed it.
      const drifted = !j.title.toLowerCase().includes(v.title.toLowerCase().slice(0, 12));
      line = [drifted ? 'DRIFT' : 'ok', moveId, v.id, j.author_name, j.title];
    }
  } catch (e) {
    bad++;
    line = ['ERROR', moveId, v.id, e.message, v.title];
  }
  rows.push(line);
  console.log(line[0].padEnd(6) + line[1].padEnd(18) + line[2].padEnd(14) + String(line[3]).slice(0, 28));
  await sleep(150);
}

console.log('\n' + Object.keys(VIDEOS).length + ' checked, ' + bad + ' unreachable');
if (rows.some((r) => r[0] === 'DRIFT')) {
  console.log('DRIFT rows changed title since videos.js was written — worth a look, not a failure.');
}
process.exit(bad ? 1 : 0);
