/* Crescendo — skills, warm-ups, glossary, badges, tips, and generators for scales, progressions and sight-reading */
'use strict';

// What each skill (unlocked by lessons) adds to your daily practice.
const SKILLS = {
  fingers: { name: 'Finger numbers', block: 'review' },
  groups: { name: 'Black-key groups', block: 'keys' },
  highlow: { name: 'High or low', block: 'ear', ear: { mode: 'highlow' } },
  keynames: { name: 'Key names', block: 'keys' },
  beat: { name: 'Steady beat', block: 'rhythm' },
  rhythm1: { name: 'Crotchets, minims, semibreves', block: 'rhythm', rlevel: 1 },
  cpos: { name: 'C position', block: 'warmup', warm: ['five-c'] },
  treble1: { name: 'Treble clef: C to G', block: 'read', read: ['treble', 'C4', 'G4'] },
  steps: { name: 'Steps and skips', block: 'ear', ear: { mode: 'stepskip' } },
  time: { name: 'Time signatures', block: 'rhythm', rtime: '3/4' },
  rhythm2: { name: 'Rests and dots', block: 'rhythm', rlevel: 2 },
  treble2: { name: 'Treble clef: C to C', block: 'read', read: ['treble', 'C4', 'C5'], warm: ['five-g'] },
  bass1: { name: 'Bass clef', block: 'read', read: ['bass', 'C3', 'C4'] },
  grand: { name: 'Grand staff', block: 'read', warm: ['contrary'] },
  together: { name: 'Hands together', block: 'warmup', warm: ['parallel-c', 'fingers'] },
  rhythm3: { name: 'Quavers and dotted crotchets', block: 'rhythm', rlevel: 3 },
  dynamics: { name: 'Dynamics and articulation', block: 'review' },
  sharps: { name: 'Sharps and flats', block: 'read', acc: true },
  'scale-C': { name: 'C major scale', block: 'scales', scale: 'C major' },
  'scale-G': { name: 'G major scale', block: 'scales', scale: 'G major' },
  'scale-F': { name: 'F major scale', block: 'scales', scale: 'F major' },
  'scale-Am': { name: 'A minor scale', block: 'scales', scale: 'A minor' },
  'scale-D': { name: 'D major scale', block: 'scales', scale: 'D major' },
  keysig1: { name: 'Key signatures', block: 'review', keys: ['C', 'G', 'F'] },
  keysig2: { name: 'More key signatures', block: 'review', keys: ['D', 'Bb'] },
  majmin: { name: 'Major or minor', block: 'ear', ear: { mode: 'quality', set: ['', 'm'] } },
  intervals: { name: 'Intervals', block: 'review' },
  'ear-int': { name: 'Hearing intervals', block: 'ear', ear: { mode: 'interval', set: [2, 3, 5, 8] } },
  triads: { name: 'Triads', block: 'chords', chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'] },
  chordtypes: { name: 'Chord types', block: 'chords', chords: ['Bdim'], ear: { mode: 'quality', set: ['', 'm', 'dim', 'aug'] } },
  inversions: { name: 'Inversions', block: 'chords', inv: true },
  broken: { name: 'Broken chords', block: 'warmup', warm: ['broken-c', 'alberti'] },
  sevenths: { name: 'Seventh chords', block: 'chords', chords: ['G7', 'Cmaj7', 'Am7', 'Dm7'], ear: { mode: 'quality', set: ['', 'm', '7', 'maj7'] } },
  romans: { name: 'Roman numerals', block: 'review' },
  'prog-classic': { name: 'I–IV–V–I', block: 'chords', prog: 'classic' },
  'prog-pop': { name: 'The pop progression', block: 'chords', prog: 'pop' },
  cadences: { name: 'Cadences', block: 'review', prog: 'amen' },
  'prog-canon': { name: 'Pachelbel progression', block: 'chords', prog: 'canon' },
  'prog-blues': { name: '12-bar blues', block: 'chords', prog: 'blues' },
  'prog-jazz': { name: 'ii–V–I', block: 'chords', prog: 'jazz' },
  accomp: { name: 'Accompaniment patterns', block: 'chords', prog: 'fifties' },
  leadsheet: { name: 'Lead sheets', block: 'sight' },
  treble3: { name: 'High notes', block: 'read', read: ['treble', 'C4', 'C6'] },
  bass2: { name: 'Low notes', block: 'read', read: ['bass', 'C2', 'C4'] },
  circle: { name: 'Circle of fifths', block: 'review', keys: ['A', 'E', 'Eb', 'Ab'] },
  keysig3: { name: 'All key signatures', block: 'review' },
  rhythm4: { name: 'Ties and syncopation', block: 'rhythm', rlevel: 4 },
  six8: { name: '6/8 time', block: 'rhythm', rtime: '6/8' },
  pedal: { name: 'The sustain pedal', block: 'review' },
  sight: { name: 'Sight-reading', block: 'sight' },
  improv: { name: 'Improvising', block: 'free' },
  minor2: { name: 'Minor keys', block: 'scales', scale: 'A harmonic' },
  byear: { name: 'Playing by ear', block: 'ear', ear: { mode: 'echo' } },
  compose: { name: 'Composing', block: 'free' },
};

// Warm-ups: short technical patterns. Each has both hands so you can pick one or both in the player.
const WARMUPS = {
  'five-c': { name: 'Five-finger pattern in C', tempo: 80, rh: 'C4q@1 D4q@2 E4q@3 F4q@4 | G4q@5 F4q@4 E4q@3 D4q@2 | C4e@1 D4e E4e F4e G4e F4e E4e D4e | C4w@1', lh: 'C3q@5 D3q@4 E3q@3 F3q@2 | G3q@1 F3q@2 E3q@3 D3q@4 | C3e@5 D3e E3e F3e G3e F3e E3e D3e | C3w@5', tip: 'Keep every finger curved and close to its key. Listen for an even sound.' },
  'five-g': { name: 'Five-finger pattern in G', tempo: 80, rh: 'G4q@1 A4q@2 B4q@3 C5q@4 | D5q@5 C5q@4 B4q@3 A4q@2 | G4e@1 A4e B4e C5e D5e C5e B4e A4e | G4w@1', lh: 'G2q@5 A2q@4 B2q@3 C3q@2 | D3q@1 C3q@2 B2q@3 A2q@4 | G2e@5 A2e B2e C3e D3e C3e B2e A2e | G2w@5', tip: 'Same shape, new place: thumb on G.' },
  fingers: { name: 'Finger independence', tempo: 72, rh: 'C4e@1 D4e@2 C4e@1 E4e@3 C4e@1 F4e@4 C4e@1 G4e@5 | G4e@5 F4e@4 G4e@5 E4e@3 G4e@5 D4e@2 G4e@5 C4e@1 | C4w@1', lh: 'C3e@5 D3e@4 C3e@5 E3e@3 C3e@5 F3e@2 C3e@5 G3e@1 | G3e@1 F3e@2 G3e@1 E3e@3 G3e@1 D3e@4 G3e@1 C3e@5 | C3w@5', tip: 'Lift each finger cleanly. Fingers 4 and 5 are naturally weaker, so be patient with them.' },
  'parallel-c': { name: 'Hands together in C', tempo: 72, rh: 'C4q@1 E4q@3 D4q@2 F4q@4 | E4q@3 G4q@5 F4q@4 D4q@2 | C4w@1', lh: 'C3q@5 E3q@3 D3q@4 F3q@2 | E3q@3 G3q@1 F3q@2 D3q@4 | C3w@5', tip: 'Both hands play the same notes an octave apart. Listen for the hands landing exactly together.' },
  contrary: { name: 'Contrary motion', tempo: 72, rh: 'C4q@1 D4q@2 E4q@3 F4q@4 | G4q@5 F4q@4 E4q@3 D4q@2 | C4w@1', lh: 'C4q@1 B3q@2 A3q@3 G3q@4 | F3q@5 G3q@4 A3q@3 B3q@2 | C4w@1', tip: 'Both thumbs start on Middle C and the hands move apart like a mirror, then back again.' },
  'broken-c': { name: 'Broken chords', tempo: 72, rh: 'C4e@1 E4e@3 G4e@5 E4e@3 C4e E4e G4e E4e | C4e@1 F4e@3 A4e@5 F4e C4e F4e A4e F4e | B3e@1 D4e@2 G4e@5 D4e B3e D4e G4e D4e | C4w@1', lh: 'C3w | F2w | G2w | C3w', tip: 'Let your hand roll gently from note to note rather than lifting each finger high.' },
  alberti: { name: 'Alberti bass', tempo: 76, lh: 'C3e@5 G3e@1 E3e@3 G3e@1 C3e G3e E3e G3e | C3e@5 A3e@1 F3e@2 A3e C3e A3e F3e A3e | B2e@5 G3e@1 D3e@3 G3e B2e G3e D3e G3e | C3e G3e E3e G3e C3h', rh: 'E4h G4h | F4h A4h | D4h F4h | E4w', tip: 'Bottom–top–middle–top. Keep the left hand quiet and smooth under the right.' },
  hanon: { name: 'Hanon exercise 1', tempo: 66, rh: 'C4e@1 E4e@2 F4e@3 G4e@4 A4e@5 G4e@4 F4e@3 E4e@2 | D4e@1 F4e G4e A4e B4e A4e G4e F4e | E4e@1 G4e A4e B4e C5e B4e A4e G4e | F4e@1 A4e B4e C5e D5e C5e B4e A4e | G4w@1', lh: 'C3e@5 E3e@4 F3e@3 G3e@2 A3e@1 G3e@2 F3e@3 E3e@4 | D3e@5 F3e G3e A3e B3e A3e G3e F3e | E3e@5 G3e A3e B3e C4e B3e A3e G3e | F3e@5 A3e B3e C4e D4e C4e B3e A3e | G3w@5', tip: 'From Charles-Louis Hanon’s “The Virtuoso Pianist” (1873). Play slowly and evenly; lift your fingers from the knuckles.' },
};

// A scale as a piece: up and down one octave in crotchets, with fingering.
const tokOf = p => p.L + (p.a === 1 ? '#' : p.a === -1 ? 'b' : p.a === 2 ? '##' : p.a === -2 ? 'bb' : '') + p.o;
function scalePiece(name, hands = 'RL', tempo = 76) {
  const [tonic, kind] = name.split(' ');
  const type = { major: 'major', minor: 'minor', harmonic: 'harmonic', melodic: 'melodic' }[kind] || 'major';
  const fing = fingering(tonic, type);
  const make = (oct, f) => {
    const upN = scaleNotes(tonic, type, oct);
    const ns = upN.concat(upN.slice(0, -1).reverse());
    const fs = f ? f.concat(f.slice(0, -1).reverse()) : [];
    const toks = ns.map((p, i) => `${tokOf(p)}q${fs[i] ? '@' + fs[i] : ''}`);
    toks.push('rq');
    return [0, 4, 8, 12].map(i => toks.slice(i, i + 4).join(' ')).join(' | ');
  };
  const key = type === 'major' ? tonic : tonic + 'm';
  const spec = { key: KEY_SIGS[key] !== undefined ? key : 'C', time: '4/4', tempo };
  const tOct = scaleNotes(tonic, type, 4)[0].m > 64 ? 3 : 4;
  if (hands.includes('R')) spec.rh = make(tOct, fing && fing.rh);
  if (hands.includes('L')) spec.lh = make(tOct - 1, fing && fing.lh);
  return parsePiece(spec);
}

// A chord progression as a piece: smooth right-hand voicings over left-hand roots.
function progPiece(id, key, pattern = 'whole') {
  const prog = PROGRESSIONS.find(p => p.id === id);
  const k = key || prog.key;
  const syms = progressionChords(prog, k);
  const vs = voiceLead(syms, 64);
  const rh = vs.map((v, i) => {
    const ch = `[${v.ps.map(tokOf).join(',')}]`;
    const sym = `"${syms[i]}"`;
    return pattern === 'pulse' ? `${sym} ${ch}q ${ch}q ${ch}q ${ch}q` : `${sym} ${ch}w`;
  }).join(' | ');
  const lh = syms.map(s => {
    const c = parseChord(s);
    let root = P(c.root.L, c.root.a, 3);
    if (root.m > 55) root = P(root.L, root.a, 2);
    return `${tokOf(root)}w`;
  }).join(' | ');
  return parsePiece({ key: KEY_SIGS[k] !== undefined ? k : 'C', time: '4/4', tempo: 72, rh, lh });
}

// A short melody to sight-read, using what you've learned.
function sightPiece(r, lvl) {
  const key = lvl >= 4 ? pick(r, ['C', 'G', 'F']) : 'C';
  const sc = scaleNotes(key, 'major', 4).concat(scaleNotes(key, 'major', 5).slice(1, 3));
  const top = lvl <= 2 ? 4 : lvl === 3 ? 5 : 7;
  const pool = sc.slice(0, top + 1);
  const rlevel = Math.min(4, Math.max(1, lvl - 1));
  const rh = makeRhythm(r, rlevel, '4/4', 4).text;
  let idx = 0;
  const toks = rh.split(' ').map(tok => {
    if (tok === '|' || tok[0] === 'r') return tok;
    const leap = r() < 0.25 ? 2 : 1;
    idx = clamp(idx + (r() < 0.5 ? -leap : leap) * (r() < 0.15 ? 0 : 1), 0, pool.length - 1);
    return tokOf(pool[idx]) + tok.slice(1);
  });
  // End on the tonic.
  for (let i = toks.length - 1; i >= 0; i--) if (toks[i] !== '|' && toks[i][0] !== 'r') { toks[i] = tokOf(pool[0]) + toks[i].replace(/^[A-G](#|b)?\d/, ''); break; }
  const spec = { key, time: '4/4', tempo: 66, rh: toks.join(' ') };
  if (lvl >= 4) spec.lh = `${key === 'G' ? 'G2' : key === 'F' ? 'F2' : 'C3'}w | ${key === 'G' ? 'D3' : key === 'F' ? 'C3' : 'G2'}w | ${key === 'G' ? 'G2' : key === 'F' ? 'F2' : 'C3'}w | ${key === 'G' ? 'G2' : key === 'F' ? 'F2' : 'C3'}w`;
  return parsePiece(spec);
}

const GLOSSARY = [
  ['Accidental', 'A sharp (♯), flat (♭) or natural (♮) that changes a note for the rest of the bar.'],
  ['Allegro', 'Fast and lively.'], ['Andante', 'At a walking pace.'], ['Adagio', 'Slowly.'], ['Moderato', 'At a moderate speed.'],
  ['Anacrusis', 'Pick-up notes before the first full bar.'],
  ['Arpeggio', 'The notes of a chord played one after another, “like a harp”.'],
  ['Bar (measure)', 'A group of beats between two bar lines.'],
  ['Cadence', 'The chord move that ends a phrase, like punctuation.'],
  ['Chord', 'Three or more notes played together.'],
  ['Clef', 'The sign at the start of a staff that fixes the notes’ names: treble (G) or bass (F).'],
  ['Crescendo (cresc.)', 'Gradually getting louder.'], ['Diminuendo (dim.)', 'Gradually getting softer.'],
  ['Crotchet (quarter note)', 'A note one beat long in 4/4.'], ['Minim (half note)', 'Two beats.'], ['Semibreve (whole note)', 'Four beats.'],
  ['Quaver (eighth note)', 'Half a beat.'], ['Semiquaver (sixteenth note)', 'A quarter of a beat.'],
  ['Dynamics', 'How loud or soft to play: p, mf, f and so on.'],
  ['Fermata', 'A pause sign (an eye over a note): hold it longer than written.'],
  ['Forte (f)', 'Loud.'], ['Piano (p)', 'Soft.'], ['Mezzo forte (mf)', 'Moderately loud.'], ['Fortissimo (ff)', 'Very loud.'], ['Pianissimo (pp)', 'Very soft.'],
  ['Interval', 'The distance between two notes, counted in letter names.'],
  ['Inversion', 'A chord rearranged so a note other than the root is lowest.'],
  ['Key signature', 'The sharps or flats at the start of each line, applying to the whole piece.'],
  ['Ledger line', 'A short extra line for notes above or below the staff.'],
  ['Legato', 'Smooth and connected.'], ['Staccato', 'Short and detached (a dot over or under the note).'],
  ['Octave', 'Eight notes up: the same letter, higher or lower.'],
  ['Pentatonic scale', 'A five-note scale with no semitones, e.g. C D E G A.'],
  ['Phrase', 'A musical sentence, often 4 bars long.'],
  ['Rest', 'A silence of a given length.'],
  ['Ritardando (rit.)', 'Gradually slowing down.'], ['A tempo', 'Back to the original speed.'],
  ['Root', 'The note a chord is built on and named after.'],
  ['Scale', 'Notes in step order from one note to its octave.'],
  ['Semitone (half step)', 'From one key to the very next, black or white.'], ['Tone (whole step)', 'Two semitones.'],
  ['Slur', 'A curved line over different notes: play them legato.'], ['Tie', 'A curved line joining two of the same note: hold for both.'],
  ['Syncopation', 'Accents falling between the beats.'],
  ['Tempo', 'The speed of the beat, in beats per minute.'],
  ['Time signature', 'Two numbers: beats per bar, and which note gets one beat.'],
  ['Triad', 'A three-note chord: root, 3rd and 5th.'],
  ['Transpose', 'Move music to a different key.'],
];

const TIPS = [
  ['Little and often', 'Fifteen minutes every day beats two hours once a week. Your brain consolidates skills while you sleep, so daily practice gives it more to work with.'],
  ['Slow it down', 'If you make the same mistake twice, play it at half speed. Slow and correct builds the right habits; fast and messy builds mistakes in.'],
  ['Fix the hard bit', 'Don’t keep starting from the beginning. Find the tricky bar, practise just that (plus one note either side), then put it back in.'],
  ['Hands separately', 'Learn each hand alone until it’s easy, then put them together slowly.'],
  ['Count out loud', 'Counting forces you to keep the beat, especially through rests and long notes.'],
  ['Mix it up', 'Switching between scales, reading and songs in one session helps you remember more than drilling one thing.'],
  ['Stay relaxed', 'Check your shoulders, wrists and jaw. Tension slows you down and tires you out.'],
  ['Look ahead', 'While you play one note, your eyes should already be on the next one.'],
  ['Listen to yourself', 'Record a piece once a week. You’ll hear things you miss while playing, and you’ll hear your progress.'],
  ['End on a win', 'Finish each session with something you enjoy playing. It keeps you coming back.'],
];

const BADGES = [
  { id: 'first', e: '🎹', name: 'First practice', about: 'Finish your first practice session.' },
  { id: 'lesson1', e: '📗', name: 'First lesson', about: 'Complete your first lesson.' },
  { id: 'song1', e: '🎵', name: 'First song', about: 'Play a song all the way through.' },
  { id: 'streak3', e: '🔥', name: 'Three in a row', about: 'Practise three days in a row.' },
  { id: 'streak7', e: '🔥', name: 'A full week', about: 'Practise seven days in a row.' },
  { id: 'streak30', e: '🏆', name: 'A month of music', about: 'Practise 30 days in a row.' },
  { id: 'hour1', e: '⏱️', name: 'First hour', about: 'Practise for an hour in total.' },
  { id: 'hour10', e: '⌛', name: 'Ten hours', about: 'Practise for ten hours in total.' },
  { id: 'unit1', e: '🌱', name: 'Unit 1 done', about: 'Finish “First steps”.' },
  { id: 'unit2', e: '📖', name: 'Reader', about: 'Finish “Reading music”.' },
  { id: 'unit3', e: '🙌', name: 'Both hands', about: 'Finish “Both hands”.' },
  { id: 'unit4', e: '🪜', name: 'Scale climber', about: 'Finish “Sharps, flats & scales”.' },
  { id: 'unit5', e: '🎼', name: 'Chord builder', about: 'Finish “Chords”.' },
  { id: 'unit6', e: '🔁', name: 'Progressive', about: 'Finish “Progressions”.' },
  { id: 'unit7', e: '👀', name: 'Fluent reader', about: 'Finish “Reading fluently”.' },
  { id: 'unit8', e: '🎓', name: 'Musician', about: 'Finish the whole course.' },
  { id: 'songs5', e: '🎶', name: 'Five songs', about: 'Earn three stars on five songs.' },
  { id: 'reader50', e: '⚡', name: 'Sharp eyes', about: 'Name 50 notes correctly.' },
  { id: 'perfect', e: '⭐', name: 'Flawless', about: 'Score 100% on a play-along.' },
];
