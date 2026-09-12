// Reference video per move.
//
// Kept in its own file on purpose: this is the app's ONLY third-party dependency and
// its only outbound network request, so it should be auditable in one place rather
// than scattered through the choreography data.
//
// VERIFICATION — every id below was checked on 2026-08-21 by:
//   1. YouTube oEmbed returning HTTP 200 (the video exists, and is not private/deleted)
//   2. Loading it in a real YT.Player against youtube-nocookie.com and receiving
//      onReady rather than onError 101/150 (the owner permits embedded playback)
//   3. Confirming a landscape aspect ratio, so none of them are vertical Shorts
// All 15 passed. Nothing here is a guess.
//
// Re-run the check any time with:  node tools/check-videos.mjs
//
// LICENCE NOTE: these are ordinary YouTube videos, not CC0 stock. They are used via
// YouTube's official embedded player, which is what the platform's terms provide for —
// the creator keeps their view count, their branding and their ability to withdraw the
// video. Nothing is downloaded, re-hosted or re-encoded. If a video is ever taken down,
// the app falls back to the animated figure rather than showing a dead frame.

// `title` and `channel` are stored EXACTLY as YouTube reports them, so the drift check
// in tools/check-videos.mjs actually means something. `label` is the tidied string the
// UI shows — some real titles carry hashtag spam that has no place in the interface.
export const VIDEOS = {
  // ---- Hip-Hop Groove
  'two-step': {
    id: 'xvmNPLFoDEc', len: '2:16', channel: 'Howcast',
    title: 'How to Do the 2-Step | Hip-Hop Dancing',
    label: 'How to Do the 2-Step',
  },
  'bounce': {
    id: 'gYNKHdpMiEc', len: '0:26', channel: 'WAKE UP DANCE STUDIO',
    title: '6 BASIC BOUNCES OF HIP-HOP #hiphopdance #tutorial #dancechallenge #dancetutorial',
    label: '6 Basic Bounces of Hip-Hop',
  },
  'heel-toe': {
    id: 'rOV-g2jMHxs', len: '3:21', channel: 'Howcast',
    title: 'How to Do the Heel Toe | Kids Hip-Hop Moves',
    label: 'How to Do the Heel Toe',
  },
  'shoulder-roll': {
    id: '3gUXGjdUV7g', len: '1:44', channel: 'Astound Dance Academy',
    title: 'Tutorial: How to do a Shoulder Roll',
    label: 'How to Do a Shoulder Roll',
  },
  'grapevine': {
    id: '1BESmZUXIJs', len: '2:11', channel: 'Howcast',
    title: 'How to Do the Grapevine Dance Move | Hip-Hop Workout',
    label: 'How to Do the Grapevine',
  },

  // ---- Latin Step
  'side-basic': {
    id: 'ISj64qzf-40', len: '2:11', channel: 'Bon Sueno',
    title: 'Salsa Dance - Core Basic Steps (2 of 7) - Side Step',
    label: 'Salsa Core Basics: Side Step',
  },
  'merengue': {
    id: 'KO_hobER7SU', len: '1:30', channel: 'Howcast',
    title: 'How to Do the Basic Step | Merengue Dance',
    label: 'Merengue: the Basic Step',
  },
  'back-rock': {
    id: 'o2ei_1GphVo', len: '2:47', channel: 'Bon Sueno',
    title: 'Salsa Dance - Core Basic Steps (4 of 7) - Rock Step',
    label: 'Salsa Core Basics: Rock Step',
  },
  'cumbia': {
    id: 'lVXmXdIh400', len: '2:34', channel: 'ExpertVillage Leaf Group',
    title: 'How to Do Basic Cumbia Dance Steps',
    label: 'Basic Cumbia Steps',
  },
  'basic-step': {
    id: 'gHwKBx3YUD8', len: '1:01', channel: 'Ballroom Feed',
    title: 'Salsa Basic Forward & Back Tutorial',
    label: 'Salsa Basic: Forward & Back',
  },

  // ---- Disco / Funk
  'the-point': {
    id: 'HsdUyZTX1lY', len: '1:49', channel: 'Bustamovebook',
    title: 'Saturday Night Fever: a step by step dance guide',
    label: 'Saturday Night Fever, step by step',
  },
  'the-hustle': {
    id: 'K-i3m8APn7E', len: '1:54', channel: 'Bustamovebook',
    title: 'The Hustle: a step by step dance guide',
    label: 'The Hustle, step by step',
  },
  'step-touch-clap': {
    id: 'GSZ7XWcId5Q', len: '2:37', channel: 'Never Stop Dancing',
    title: 'BASIC DANCE STEPS: STEP TOUCH',
    label: 'Basic Dance Steps: Step Touch',
  },
  'arm-roll': {
    id: 'piyAZxaQhHo', len: '2:45', channel: 'MoveTube Network',
    title: 'Disco Tutorial - Easy to Follow Arms Routine with Doriana Sanchez',
    label: 'Disco: Easy Arms Routine',
  },
  'the-bump': {
    id: '_gwshF-cP74', len: '1:17', channel: 'Bustamovebook',
    title: 'The Bump: a step by step dance guide',
    label: 'The Bump, step by step',
  },
};

// youtube-nocookie.com is YouTube's privacy-enhanced host: it does not write tracking
// cookies until the viewer actually starts playback.
export function embedUrl(moveId, { autoplay = false } = {}) {
  const v = VIDEOS[moveId];
  if (!v) return null;
  const p = new URLSearchParams({
    rel: '0',                 // no "related videos" from other channels at the end
    modestbranding: '1',
    playsinline: '1',
    autoplay: autoplay ? '1' : '0',
    enablejsapi: '1',
  });
  return 'https://www.youtube-nocookie.com/embed/' + v.id + '?' + p;
}

export function watchUrl(moveId) {
  const v = VIDEOS[moveId];
  return v ? 'https://www.youtube.com/watch?v=' + v.id : null;
}
