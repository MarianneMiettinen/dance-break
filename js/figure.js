// Browser renderer for the dancer. All the maths lives in skeleton.js so that the
// offline contact-sheet tool draws exactly the same figure.

import { solve, VIEWBOX } from './skeleton.js';

const NS = 'http://www.w3.org/2000/svg';

export class Figure {
  constructor(svg) {
    this.svg = svg;
    svg.setAttribute('viewBox', VIEWBOX);
    svg.setAttribute('role', 'img');

    this.title = document.createElementNS(NS, 'title');
    svg.appendChild(this.title);

    this.shadow = document.createElementNS(NS, 'ellipse');
    this.shadow.setAttribute('class', 'fig-shadow');
    svg.appendChild(this.shadow);

    this.lines = {};
    // One pass over a reference solve to create the elements in painting order.
    const ref = solve(NEUTRAL);
    for (const seg of ref.segments) {
      const el = document.createElementNS(NS, 'line');
      el.setAttribute('class', seg.cls);
      el.setAttribute('stroke-width', seg.w);
      el.setAttribute('stroke-linecap', 'round');
      svg.appendChild(el);
      this.lines[seg.k] = el;
    }

    const circle = (cls, r) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('r', r);
      svg.appendChild(c);
      return c;
    };
    this.hands = [circle('fig-hand', 5.5), circle('fig-hand', 5.5)];
    this.head = circle('fig-head', ref.head.r);
  }

  setLabel(text) { this.title.textContent = text; }

  apply(pose) {
    const s = solve(pose);
    for (const seg of s.segments) {
      const el = this.lines[seg.k];
      el.setAttribute('x1', seg.a[0].toFixed(2));
      el.setAttribute('y1', seg.a[1].toFixed(2));
      el.setAttribute('x2', seg.b[0].toFixed(2));
      el.setAttribute('y2', seg.b[1].toFixed(2));
    }
    this.head.setAttribute('cx', s.head.x.toFixed(2));
    this.head.setAttribute('cy', s.head.y.toFixed(2));
    for (let i = 0; i < 2; i++) {
      this.hands[i].setAttribute('cx', s.hands[i].x.toFixed(2));
      this.hands[i].setAttribute('cy', s.hands[i].y.toFixed(2));
    }
    this.shadow.setAttribute('cx', s.shadow.cx.toFixed(2));
    this.shadow.setAttribute('cy', s.shadow.cy);
    this.shadow.setAttribute('rx', s.shadow.rx.toFixed(2));
    this.shadow.setAttribute('ry', s.shadow.ry);
    this.shadow.setAttribute('opacity', s.shadow.opacity.toFixed(3));
  }
}

const NEUTRAL = {
  shift: 0, bob: 0, lean: 0, sh: 0, hip: 0, head: 0,
  armR: [14, 8], armL: [-14, 8], legR: [7, 3], legL: [-7, 3],
};

export { poseAt } from './skeleton.js';
