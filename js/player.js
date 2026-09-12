// Wrapper around YouTube's IFrame Player API.
//
// Why a wrapper: this is the one place the app talks to a third party, and the raw API
// is global-callback based (window.onYouTubeIframeAPIReady), loads asynchronously, and
// can simply fail — blocked by an extension, offline, or the video withdrawn. All of
// that is contained here so the rest of the app sees a small promise-based object and
// one `onFail` callback.
//
// PRIVACY: the player itself is served from youtube-nocookie.com, which does not set
// tracking cookies until playback actually starts. The API *script* has to come from
// youtube.com — there is no nocookie copy of it. Nothing loads until openBreak runs.

const API_SRC = 'https://www.youtube.com/iframe_api';
const HOST = 'https://www.youtube-nocookie.com';

let apiPromise = null;

function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    const s = document.createElement('script');
    s.src = API_SRC;
    s.async = true;
    s.onerror = () => reject(new Error('YouTube API blocked'));
    document.head.appendChild(s);
    // Belt and braces: an ad-blocker can let the request through but serve nothing,
    // in which case onerror never fires and the callback never runs.
    setTimeout(() => {
      if (window.YT && window.YT.Player) resolve(window.YT);
      else reject(new Error('YouTube API timed out'));
    }, 10_000);
  });
  return apiPromise;
}

export class VideoPlayer {
  // mount: an element that will be REPLACED by the player iframe.
  constructor(mount, { onStateChange, onFail } = {}) {
    this.mount = mount;
    this.onStateChange = onStateChange || (() => {});
    this.onFail = onFail || (() => {});
    this.yt = null;
    this.ready = false;
    this.failed = false;
    this.currentId = null;
    this._gen = 0;          // bumped per load, so a stale load can never win
  }

  async load(videoId) {
    this.currentId = videoId;
    const gen = ++this._gen;
    let YT;
    try {
      YT = await loadApi();
    } catch (e) {
      this.failed = true;
      this.onFail(e.message);
      return false;
    }

    // Re-use the player across moves; creating one per break leaks iframes.
    if (this.yt && this.ready) return this._cueAndConfirm(videoId, gen);

    const holder = document.createElement('div');
    this.mount.textContent = '';
    this.mount.appendChild(holder);

    return new Promise((resolve) => {
      this.yt = new YT.Player(holder, {
        videoId,
        host: HOST,
        playerVars: {
          rel: 0,               // keep "up next" inside this creator's own videos
          modestbranding: 1,
          playsinline: 1,
          controls: 1,          // the user gets YouTube's own scrubber too
          origin: location.origin,
          // Most of these tutorials run well under three minutes, so watching once
          // could never reach the break length. Looping is also just what you want
          // while practising a step. `playlist` is required for loop on a single
          // video — YouTube's API only loops playlists, and this makes one of length 1.
          loop: 1,
          playlist: videoId,
        },
        events: {
          onReady: () => { this.ready = true; resolve(true); },
          onStateChange: (e) => this.onStateChange(e.data),
          onError: (e) => {
            // 101 and 150 both mean the owner disallows embedded playback; 100 means
            // the video is gone. Either way the figure takes over.
            this.failed = true;
            this.onFail('player error ' + e.data);
            resolve(false);
          },
        },
      });
      setTimeout(() => { if (!this.ready) resolve(false); }, 12_000);
    });
  }

  // The id the player has actually got loaded, which is not always the one last asked for.
  get loadedId() {
    try { return this.yt.getVideoData().video_id || null; } catch { return null; }
  }

  // cuePlaylist is asynchronous and a second call issued while the first is still in
  // flight is silently dropped — which showed up as the player keeping the previous
  // move's video. So: ask, then confirm it actually took, and ask once more if not.
  //
  // cuePlaylist rather than cueVideoById because loop only applies to playlists;
  // cueVideoById would quietly discard the looping set up at construction.
  async _cueAndConfirm(videoId, gen) {
    const stale = () => gen !== this._gen;
    const cue = () => {
      try { this.yt.cuePlaylist([videoId]); this.yt.setLoop(true); }
      catch { try { this.yt.cueVideoById(videoId); } catch { /* player gone */ } }
    };
    cue();
    for (let i = 0; i < 28; i++) {
      await new Promise((r) => setTimeout(r, 125));
      if (stale()) return false;               // a newer load took over; stand down
      if (this.loadedId === videoId) return true;
      if (i === 12) cue();                     // one retry, halfway through
    }
    return this.loadedId === videoId;
  }

  play() { if (this.ready && this.yt) this.yt.playVideo(); }
  pause() { if (this.ready && this.yt) this.yt.pauseVideo(); }

  get playing() {
    if (!this.ready || !this.yt || !window.YT) return false;
    try { return this.yt.getPlayerState() === window.YT.PlayerState.PLAYING; }
    catch { return false; }
  }

  setMuted(m) {
    if (!this.ready || !this.yt) return;
    try { m ? this.yt.mute() : this.yt.unMute(); } catch { /* not ready yet */ }
  }

  // 0.5 and 0.75 are always available; YouTube ignores rates it does not support.
  setRate(r) {
    if (!this.ready || !this.yt) return;
    try { this.yt.setPlaybackRate(r); } catch { /* ignore */ }
  }

  stop() {
    if (this.ready && this.yt) { try { this.yt.stopVideo(); } catch { /* ignore */ } }
  }
}

export const PLAYER_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
