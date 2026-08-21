// Move library. 3 styles x 5 moves.
//
// POSE MODEL
// The figure is MIRRORED: it moves the same direction on screen that you should move.
// Screen-right is your right. Copy what you see.
//
// All angles are degrees. A limb angle of 0 points straight DOWN.
// Positive limb angle swings the limb toward SCREEN RIGHT.
// Joint bend (2nd number) is a magnitude >= 0 and always folds toward the body's
// midline, which is what a knee and an elbow actually do seen from the front.
//
//   shift  px, whole body sideways      (+ right)
//   bob    px, whole body vertical      (+ down / dip)
//   lean   deg, torso tilt              (+ top toward right)
//   sh     deg, shoulder line rotation  (+ right shoulder DOWN)
//   hip    deg, hip line rotation       (+ right hip UP)
//   head   deg, head tilt               (+ toward right)
//   armR / armL  [shoulderAngle, elbowBend]
//   legR / legL  [hipAngle, kneeBend]

const P = (o = {}) => ({
  shift: 0, bob: 0, lean: 0, sh: 0, hip: 0, head: 0,
  armR: [14, 8], armL: [-14, 8],
  legR: [7, 3], legL: [-7, 3],
  ...o,
});

export const STYLES = [
  {
    id: 'hiphop',
    name: 'Hip-Hop Groove',
    bpm: 92,
    blurb: 'Mostly weight shifting. The lowest bar there is.',
    moves: [
      {
        id: 'two-step',
        name: 'Two-Step',
        beats: 4,
        space: 'One step each way.',
        cues: ['step right', 'together', 'step left', 'together'],
        steps: [
          'Step your right foot out to the right.',
          'Bring your left foot to meet it. Small dip.',
          'Step your left foot out to the left.',
          'Bring your right foot back to meet it.',
        ],
        note: 'If you only ever learn one, learn this one.',
        frames: [
          [0, P({ shift: 12, hip: -4, legR: [22, 2], legL: [-2, 10], armR: [26, 30], armL: [-8, 40] })],
          [1, P({ shift: 4, bob: 7, legR: [8, 12], legL: [-8, 12], armR: [16, 45], armL: [-16, 45] })],
          [2, P({ shift: -12, hip: 4, legR: [2, 10], legL: [-22, 2], armR: [8, 40], armL: [-26, 30] })],
          [3, P({ shift: -4, bob: 7, legR: [8, 12], legL: [-8, 12], armR: [16, 45], armL: [-16, 45] })],
        ],
      },
      {
        id: 'bounce',
        name: 'Bounce',
        beats: 2,
        space: 'Standing still.',
        cues: ['down', 'up'],
        steps: [
          'Feet under your hips. Soften your knees.',
          'Drop on the beat, rise between beats.',
          'Let your shoulders follow. Nothing else has to move.',
        ],
        note: 'This is the engine under every other hip-hop move.',
        frames: [
          [0, P({ bob: 11, legR: [9, 16], legL: [-9, 16], armR: [18, 40], armL: [-18, 40] })],
          [0.5, P({ bob: -2, legR: [6, 2], legL: [-6, 2], armR: [12, 14], armL: [-12, 14] })],
          [1, P({ bob: 11, legR: [9, 16], legL: [-9, 16], armR: [18, 40], armL: [-18, 40] })],
          [1.5, P({ bob: -2, legR: [6, 2], legL: [-6, 2], armR: [12, 14], armL: [-12, 14] })],
        ],
      },
      {
        id: 'heel-toe',
        name: 'Heel-Toe Rock',
        beats: 4,
        space: 'Half a step each way.',
        cues: ['right heel', 'back', 'left heel', 'back'],
        steps: [
          'Tap your right heel out to the side.',
          'Pull it back under you.',
          'Tap your left heel out.',
          'Pull it back. Keep the bounce going underneath.',
        ],
        note: 'Quieter than it looks. Fine in an apartment.',
        frames: [
          [0, P({ bob: 6, lean: -5, legR: [30, 0], legL: [-6, 14], armR: [30, 25], armL: [-14, 35] })],
          [1, P({ bob: 9, legR: [8, 14], legL: [-8, 14], armR: [16, 40], armL: [-16, 40] })],
          [2, P({ bob: 6, lean: 5, legR: [6, 14], legL: [-30, 0], armR: [14, 35], armL: [-30, 25] })],
          [3, P({ bob: 9, legR: [8, 14], legL: [-8, 14], armR: [16, 40], armL: [-16, 40] })],
        ],
      },
      {
        id: 'shoulder-roll',
        name: 'Shoulder Roll',
        beats: 4,
        space: 'Standing still.',
        cues: ['right back', 'right down', 'left back', 'left down'],
        steps: [
          'Roll your right shoulder up and back.',
          'Let it drop.',
          'Same on the left.',
          'Keep a small bounce in your knees the whole time.',
        ],
        note: 'Do this one if your shoulders are up by your ears.',
        frames: [
          [0, P({ bob: 4, sh: -9, lean: -3, armR: [24, 55], armL: [-12, 20] })],
          [1, P({ bob: 8, sh: 5, armR: [10, 20], armL: [-12, 22] })],
          [2, P({ bob: 4, sh: 9, lean: 3, armR: [12, 20], armL: [-24, 55] })],
          [3, P({ bob: 8, sh: -5, armR: [12, 22], armL: [-10, 20] })],
        ],
      },
      {
        id: 'cross-step',
        name: 'Cross Step',
        beats: 4,
        space: 'One step each way.',
        cues: ['cross right', 'open', 'cross left', 'open'],
        steps: [
          'Cross your right foot in front of your left.',
          'Step back out to open.',
          'Cross your left foot in front of your right.',
          'Step back out. Arms swing across as you cross.',
        ],
        note: 'Go slow first. The crossing is the whole trick.',
        frames: [
          [0, P({ shift: -6, bob: 5, lean: 6, hip: 6, legR: [-16, 16], legL: [-14, 4], armR: [-24, 50], armL: [-34, 25] })],
          [1, P({ bob: 8, legR: [12, 12], legL: [-12, 12], armR: [16, 35], armL: [-16, 35] })],
          [2, P({ shift: 6, bob: 5, lean: -6, hip: -6, legR: [14, 4], legL: [16, 16], armR: [34, 25], armL: [24, 50] })],
          [3, P({ bob: 8, legR: [12, 12], legL: [-12, 12], armR: [16, 35], armL: [-16, 35] })],
        ],
      },
    ],
  },

  {
    id: 'latin',
    name: 'Latin Step',
    bpm: 96,
    blurb: 'A footwork pattern to occupy the part of your head that was on the screen.',
    moves: [
      {
        id: 'side-basic',
        name: 'Side Basic',
        beats: 4,
        space: 'One step each way.',
        cues: ['left', 'together', 'right', 'together'],
        steps: [
          'Step your left foot to the left.',
          'Bring your right to meet it, weight lands.',
          'Step your right foot to the right.',
          'Bring your left to meet it. Hips lead, not shoulders.',
        ],
        note: 'The hips move because the feet moved. Not the other way round.',
        frames: [
          [0, P({ shift: -13, hip: 7, lean: 3, legR: [-2, 8], legL: [-24, 2], armR: [22, 60], armL: [-30, 45] })],
          [1, P({ shift: -5, hip: -4, legR: [8, 6], legL: [-8, 6], armR: [24, 55], armL: [-24, 55] })],
          [2, P({ shift: 13, hip: -7, lean: -3, legR: [24, 2], legL: [2, 8], armR: [30, 45], armL: [-22, 60] })],
          [3, P({ shift: 5, hip: 4, legR: [8, 6], legL: [-8, 6], armR: [24, 55], armL: [-24, 55] })],
        ],
      },
      {
        id: 'merengue',
        name: 'Merengue March',
        beats: 4,
        space: 'Standing still.',
        cues: ['right', 'left', 'right', 'left'],
        steps: [
          'March in place, one foot per beat.',
          'Let the hip on the standing side push out.',
          'Small steps. Knees stay soft.',
        ],
        note: 'The easiest way into Latin. It is a march with hips.',
        frames: [
          [0, P({ hip: -9, lean: -4, shift: 4, legR: [10, 28], legL: [-6, 2], armR: [20, 50], armL: [-26, 40] })],
          [1, P({ hip: 9, lean: 4, shift: -4, legR: [6, 2], legL: [-10, 28], armR: [26, 40], armL: [-20, 50] })],
          [2, P({ hip: -9, lean: -4, shift: 4, legR: [10, 28], legL: [-6, 2], armR: [20, 50], armL: [-26, 40] })],
          [3, P({ hip: 9, lean: 4, shift: -4, legR: [6, 2], legL: [-10, 28], armR: [26, 40], armL: [-20, 50] })],
        ],
      },
      {
        id: 'back-rock',
        name: 'Back Rock',
        beats: 4,
        space: 'Half a step back.',
        cues: ['rock back', 'replace', 'rock back', 'replace'],
        steps: [
          'Rock your right foot back behind you.',
          'Push off it, weight forward again.',
          'Rock your left foot back.',
          'Push off, weight forward. Stay upright.',
        ],
        note: 'Two beats, endless variations. This is the salsa engine.',
        frames: [
          [0, P({ bob: 4, lean: -7, hip: -5, legR: [-13, 26], legL: [-13, 2], armR: [34, 30], armL: [-18, 55] })],
          [1, P({ bob: -1, legR: [8, 6], legL: [-8, 6], armR: [22, 50], armL: [-22, 50] })],
          [2, P({ bob: 4, lean: 7, hip: 5, legR: [13, 2], legL: [13, 26], armR: [18, 55], armL: [-34, 30] })],
          [3, P({ bob: -1, legR: [8, 6], legL: [-8, 6], armR: [22, 50], armL: [-22, 50] })],
        ],
      },
      {
        id: 'cumbia',
        name: 'Cumbia Step',
        beats: 4,
        space: 'One step back, diagonally.',
        cues: ['back right', 'in place', 'back left', 'in place'],
        steps: [
          'Slide your right foot back and slightly behind.',
          'Shift your weight forward onto the left.',
          'Slide your left foot back.',
          'Shift forward again. It travels in a slow circle.',
        ],
        note: 'Drag the foot rather than lift it. That is the Cumbia part.',
        frames: [
          [0, P({ shift: 5, bob: 3, lean: -6, hip: -7, legR: [26, 8], legL: [-8, 6], armR: [36, 35], armL: [-16, 50] })],
          [1, P({ shift: -2, bob: 6, hip: 4, legR: [10, 10], legL: [-12, 6], armR: [20, 50], armL: [-24, 45] })],
          [2, P({ shift: -5, bob: 3, lean: 6, hip: 7, legR: [8, 6], legL: [-26, 8], armR: [16, 50], armL: [-36, 35] })],
          [3, P({ shift: 2, bob: 6, hip: -4, legR: [12, 6], legL: [-10, 10], armR: [24, 45], armL: [-20, 50] })],
        ],
      },
      {
        id: 'basic-step',
        name: 'Basic Step',
        beats: 8,
        space: 'Half a step forward and back.',
        cues: ['forward', 'replace', 'together', 'hold', 'back', 'replace', 'together', 'hold'],
        steps: [
          '1 step your left foot forward. 2 weight back to the right.',
          '3 bring the left back under you. 4 hold.',
          '5 step your right foot back. 6 weight forward to the left.',
          '7 bring the right back under you. 8 hold.',
        ],
        note: 'The count is 1-2-3, pause, 5-6-7, pause. The pause is real.',
        frames: [
          [0, P({ bob: 5, lean: 5, hip: 6, legR: [-6, 4], legL: [-22, 14], armR: [30, 40], armL: [-26, 55] })],
          [1, P({ bob: 2, lean: -4, hip: -5, legR: [16, 6], legL: [-12, 10], armR: [22, 55], armL: [-30, 40] })],
          [2, P({ bob: 5, legR: [8, 6], legL: [-8, 6], armR: [24, 50], armL: [-24, 50] })],
          [3, P({ bob: 3, hip: 3, legR: [8, 4], legL: [-8, 8], armR: [22, 50], armL: [-22, 50] })],
          [4, P({ bob: 5, lean: -5, hip: -6, legR: [22, 14], legL: [6, 4], armR: [26, 55], armL: [-30, 40] })],
          [5, P({ bob: 2, lean: 4, hip: 5, legR: [12, 10], legL: [-16, 6], armR: [30, 40], armL: [-22, 55] })],
          [6, P({ bob: 5, legR: [8, 6], legL: [-8, 6], armR: [24, 50], armL: [-24, 50] })],
          [7, P({ bob: 3, hip: -3, legR: [8, 8], legL: [-8, 4], armR: [22, 50], armL: [-22, 50] })],
        ],
      },
    ],
  },

  {
    id: 'disco',
    name: 'Disco / Funk',
    bpm: 116,
    blurb: 'Arm-led and fast. The one that actually changes your mood.',
    moves: [
      {
        id: 'the-point',
        name: 'The Point',
        beats: 4,
        space: 'Standing still. Arms need room.',
        cues: ['up right', 'down left', 'up left', 'down right'],
        steps: [
          'Right arm points up to the right.',
          'Same arm cuts down across to your left hip.',
          'Left arm points up to the left.',
          'Cuts down across to your right hip. Knees bounce throughout.',
        ],
        note: 'Yes, that one. Commit to it or it does not work.',
        frames: [
          [0, P({ bob: 3, lean: -6, shift: 3, armR: [152, 0], armL: [-28, 60], legR: [14, 6], legL: [-8, 10] })],
          [1, P({ bob: 8, lean: 4, armR: [-32, 25], armL: [-20, 45], legR: [8, 12], legL: [-12, 8] })],
          [2, P({ bob: 3, lean: 6, shift: -3, armR: [28, 60], armL: [-152, 0], legR: [8, 10], legL: [-14, 6] })],
          [3, P({ bob: 8, lean: -4, armR: [20, 45], armL: [32, 25], legR: [12, 8], legL: [-8, 12] })],
        ],
      },
      {
        id: 'the-hustle',
        name: 'The Hustle',
        beats: 4,
        space: 'One step each way.',
        cues: ['back', 'right', 'left', 'clap'],
        steps: [
          'Step back on your right.',
          'Step right, out to the side.',
          'Step left, back across.',
          'Feet together, clap. Then again.',
        ],
        note: 'Four counts, then it repeats. That is the whole dance.',
        frames: [
          [0, P({ bob: 4, lean: -5, legR: [-14, 22], legL: [-10, 4], armR: [40, 30], armL: [-40, 30] })],
          [1, P({ shift: 12, bob: 3, hip: -6, legR: [26, 2], legL: [2, 10], armR: [56, 20], armL: [-20, 55] })],
          [2, P({ shift: -12, bob: 3, hip: 6, legR: [-2, 10], legL: [-26, 2], armR: [20, 55], armL: [-56, 20] })],
          [3, P({ bob: 7, legR: [6, 12], legL: [-6, 12], armR: [46, 75], armL: [-46, 75] })],
        ],
      },
      {
        id: 'step-touch-clap',
        name: 'Step-Touch Clap',
        beats: 4,
        space: 'One step each way.',
        cues: ['step right', 'touch + clap', 'step left', 'touch + clap'],
        steps: [
          'Step out to the right.',
          'Touch your left toe beside it and clap.',
          'Step out to the left.',
          'Touch your right toe beside it and clap.',
        ],
        note: 'The easiest move here. Also the one that gets people going.',
        frames: [
          [0, P({ shift: 11, bob: 3, hip: -5, legR: [24, 2], legL: [0, 12], armR: [34, 30], armL: [-34, 30] })],
          [1, P({ shift: 8, bob: 6, legR: [16, 4], legL: [6, 16], armR: [40, 78], armL: [-40, 78] })],
          [2, P({ shift: -11, bob: 3, hip: 5, legR: [0, 12], legL: [-24, 2], armR: [34, 30], armL: [-34, 30] })],
          [3, P({ shift: -8, bob: 6, legR: [-6, 16], legL: [-16, 4], armR: [40, 78], armL: [-40, 78] })],
        ],
      },
      {
        id: 'arm-roll',
        name: 'Arm Roll',
        beats: 4,
        space: 'Standing still. Arms need room.',
        cues: ['roll', 'roll', 'roll', 'roll'],
        steps: [
          'Forearms in front of you, one over the other.',
          'Roll them around each other, one full turn per beat.',
          'Keep a small step-touch going underneath.',
        ],
        note: 'Wrists loose. It stops working if you tense up.',
        frames: [
          [0, P({ bob: 4, armR: [66, 85], armL: [-30, 95], legR: [10, 8], legL: [-10, 8] })],
          [0.5, P({ bob: 6, armR: [48, 100], armL: [-48, 80], legR: [9, 10], legL: [-9, 10] })],
          [1, P({ bob: 7, armR: [30, 95], armL: [-66, 85], legR: [8, 12], legL: [-8, 12] })],
          [1.5, P({ bob: 6, armR: [48, 80], armL: [-48, 100], legR: [9, 10], legL: [-9, 10] })],
        ],
      },
      {
        id: 'the-bump',
        name: 'The Bump',
        beats: 4,
        space: 'Standing still.',
        cues: ['bump right', 'centre', 'bump left', 'centre'],
        steps: [
          'Push your right hip out to the side.',
          'Back to centre.',
          'Push your left hip out.',
          'Back to centre. Arms swing opposite the hip.',
        ],
        note: 'Small movement. Your lower back will thank you.',
        frames: [
          [0, P({ shift: 9, hip: -11, lean: -7, legR: [16, 2], legL: [-4, 14], armR: [-16, 30], armL: [-40, 45] })],
          [1, P({ bob: 5, legR: [8, 8], legL: [-8, 8], armR: [22, 40], armL: [-22, 40] })],
          [2, P({ shift: -9, hip: 11, lean: 7, legR: [4, 14], legL: [-16, 2], armR: [40, 45], armL: [16, 30] })],
          [3, P({ bob: 5, legR: [8, 8], legL: [-8, 8], armR: [22, 40], armL: [-22, 40] })],
        ],
      },
    ],
  },
];

export const ALL_MOVES = STYLES.flatMap((s) =>
  s.moves.map((m) => ({ ...m, styleId: s.id, styleName: s.name, bpm: s.bpm }))
);

export function findMove(id) {
  return ALL_MOVES.find((m) => m.id === id) || ALL_MOVES[0];
}

// Opens a YouTube search, never a specific video ID. A search URL cannot rot;
// a hardcoded video ID can, and I will not ship one I have not verified.
export function referenceSearchUrl(move) {
  const q = move.styleName + ' ' + move.name + ' dance tutorial beginner';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
