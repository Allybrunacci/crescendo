/* Crescendo — the course, part 2: units 5–8 */
'use strict';

LESSONS.push(
  /* ===================== Unit 5: Chords ===================== */
  { id: 'u5l1', u: 5, title: 'Intervals', mins: 9, skills: ['intervals', 'ear-int'], cards: [
    { t: 'text', h: 'Measuring distance', p: ['An **interval** is the distance between two notes. Count the letters from the bottom note to the top, including both: C to E is C-D-E, a **3rd**. C to G is a **5th**, and C to the next C is an **octave**.'] },
    { t: 'staff', h: 'Intervals from C', music: '[C4,D4]h [C4,E4]h | [C4,F4]h [C4,G4]h | [C4,A4]h [C4,B4]h | [C4,C5]w', p: ['2nd, 3rd, 4th, 5th, 6th, 7th, octave. On the staff, 3rds, 5ths and 7ths are line-to-line or space-to-space. Tap one to hear it.'] },
    { t: 'drill', h: 'Name the interval', spec: { k: 'intervals', names: true, count: 10 } },
    { t: 'text', h: 'Major and minor 3rds', p: ['3rds come in two sizes. A **major 3rd** is 4 {semis} ([[keys:C4 E4|C–E]]); a **minor 3rd** is 3 {semis} ([[keys:C4 Eb4|C–E♭]], [[keys:A3 C4|A–C]]). That one difference is what makes chords major or minor.'] },
    { t: 'drill', h: 'Hear intervals', spec: { k: 'ear', mode: 'interval', set: [2, 3, 5, 8], count: 8 } },
  ] },
  { id: 'u5l2', u: 5, title: 'Triads', mins: 10, skills: ['triads'], songs: ['chord-study'], cards: [
    { t: 'text', h: 'Stacking 3rds', p: ['A **triad** is a three-note chord built from stacked 3rds: a **root**, a **3rd** and a **5th**. On the staff it looks like a snowman: line-line-line or space-space-space.'] },
    { t: 'staff', h: 'C, F and G', music: '"C" [C4,E4,G4]h@1,3,5 "F" [F4,A4,C5]h@1,3,5 | "G" [G4,B4,D5]h@1,3,5 "C" [C4,E4,G4]h@1,3,5', p: ['These three major chords in C major are enough for hundreds of songs. Play each with fingers **1 3 5**.'] },
    { t: 'text', h: 'Major or minor?', p: ['A **major** triad has a major 3rd at the bottom (4 {semis}) and then a minor 3rd. A **minor** triad flips them: minor 3rd first. Chord symbols write minor with a small **m**: [[chord:C]] [[chord:Cm]] [[chord:A]] [[chord:Am]]'] },
    { t: 'drill', h: 'Build the chord', spec: { k: 'chordbuild', chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'], count: 8 } },
    { t: 'drill', h: 'Major or minor?', spec: { k: 'ear', mode: 'quality', set: ['', 'm'], count: 6 } },
    { t: 'play', h: 'Three-Chord Study', song: 'chord-study', p: ['Right-hand chords with smooth changes, then a left-hand bass note underneath.'] },
  ] },
  { id: 'u5l3', u: 5, title: 'Chord symbols and colours', mins: 8, skills: ['chordtypes'], cards: [
    { t: 'text', h: 'Reading chord symbols', p: ['Pop, jazz and folk music often prints **chord symbols** above the melody: **C** means C major, **Am** A minor, **G7** a G seventh, and **C/E** a C chord with E as the lowest note.'] },
    { t: 'text', h: 'Diminished and augmented', p: ['Two more triads: **diminished** is two minor 3rds stacked (B–D–F, written Bdim or B°) and sounds tense: [[chord:Bdim]]. **Augmented** is two major 3rds (C–E–G♯, written Caug or C+) and sounds dreamy and unsettled: [[chord:Caug]]'] },
    { t: 'text', h: 'Suspended chords', p: ['A **sus** chord swaps the 3rd for a 2nd or a 4th: **Csus2** is C–D–G ([[chord:Csus2]]) and **Csus4** is C–F–G ([[chord:Csus4]]). Neither major nor minor, they sound open and want to move.'] },
    { t: 'drill', h: 'Name the chord', spec: { k: 'chordname', chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'Bdim'], count: 8 } },
    { t: 'drill', h: 'What kind of chord?', spec: { k: 'ear', mode: 'quality', set: ['', 'm', 'dim', 'aug'], count: 8 } },
  ] },
  { id: 'u5l4', u: 5, title: 'Inversions', mins: 9, skills: ['inversions'], cards: [
    { t: 'text', h: 'Rearranging a chord', p: ['A chord doesn’t have to start on its root. Move the bottom note up an octave and you get an **inversion**: the same chord in a different shape.'] },
    { t: 'staff', h: 'C major, three ways', music: '[C4,E4,G4]h [E4,G4,C5]h | [G4,C5,E5]h [C4,E4,G4]h', p: ['**Root position** C–E–G, **1st inversion** E–G–C and **2nd inversion** G–C–E. In an inversion, look for the 4th (the wider gap): its top note is the root.'] },
    { t: 'play', h: 'Smooth chord changes', rh: '"C" [C4,E4,G4]h@1,3,5 "F" [C4,F4,A4]h@1,3,5 | "G" [B3,D4,G4]h@1,2,5 "C" [C4,E4,G4]h@1,3,5', lh: 'C3h F2h | G2h C3h', tempo: 66, p: ['Inversions let the right hand barely move: C stays put for the F chord, and only two fingers shift for G. This is how pianists play chords in real music.'] },
    { t: 'drill', h: 'Name chords in any shape', spec: { k: 'chordname', chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'], inversions: true, count: 8 } },
  ] },
  { id: 'u5l5', u: 5, title: 'Broken chords and arpeggios', mins: 9, skills: ['broken'], songs: ['prelude-c'], cards: [
    { t: 'text', h: 'Chords, one note at a time', p: ['Play a chord’s notes one after another and you get a **broken chord**. Run it up through several octaves and it’s an **arpeggio** (Italian for “like a harp”). Accompaniments are full of them.'] },
    { t: 'play', h: 'Broken chords in C', rh: 'C4e@1 E4e@3 G4e@5 E4e@3 C4e E4e G4e E4e | C4e@1 F4e@3 A4e@5 F4e C4e F4e A4e F4e | B3e@1 D4e@2 G4e@5 D4e B3e D4e G4e D4e | C4w@1', lh: 'C3w | F2w | G2w | C3w', tempo: 72 },
    { t: 'text', h: 'The Alberti bass', p: ['A famous left-hand pattern from the 1700s, used by Mozart and Haydn: **bottom–top–middle–top**. For C major that’s C–G–E–G, over and over.'] },
    { t: 'play', h: 'Alberti bass', clef: 'bass', hand: 'L', music: 'C3e@5 G3e@1 E3e@3 G3e@1 C3e G3e E3e G3e | C3e@5 A3e@1 F3e@2 A3e C3e A3e F3e A3e | B2e@5 G3e@1 D3e@3 G3e B2e G3e D3e G3e | C3e G3e E3e G3e C3h', tempo: 76 },
    { t: 'play', h: 'Prelude in C (opening)', song: 'prelude-c', p: ['J. S. Bach’s Prelude in C (1722) is one long chain of broken chords. This simplified opening keeps its famous harmonies.'] },
  ] },
  { id: 'u5l6', u: 5, title: 'Seventh chords', mins: 8, skills: ['sevenths'], cards: [
    { t: 'text', h: 'Adding a 7th', p: ['Stack one more 3rd on a triad and you get a **seventh chord**, with four notes and a richer sound:', '- **Major 7th** (Cmaj7: C E G B): soft and dreamy. [[chord:Cmaj7]]\n- **Dominant 7th** (G7: G B D F): bluesy, and it really wants to resolve. [[chord:G7]]\n- **Minor 7th** (Am7: A C E G): mellow and smooth. [[chord:Am7]]'] },
    { t: 'staff', h: 'G7 pulls home', music: '"G7" [G3,B3,D4,F4]h "C" [G3,C4,E4]h | "G7" [B3,D4,F4,G4]h "C" [C4,E4,G4]h', p: ['The dominant 7th (built on the 5th note of the key) leans towards the home chord. Listen to how G7 wants to become C.'] },
    { t: 'drill', h: 'Build seventh chords', spec: { k: 'chordbuild', chords: ['G7', 'Cmaj7', 'Am7', 'Dm7', 'C7'], count: 6 } },
    { t: 'drill', h: 'Hear the difference', spec: { k: 'ear', mode: 'quality', set: ['', 'm', '7', 'maj7'], count: 8 } },
  ] },

  /* ===================== Unit 6: Progressions ===================== */
  { id: 'u6l1', u: 6, title: 'Roman numerals', mins: 8, skills: ['romans'], cards: [
    { t: 'text', h: 'Chords from a scale', p: ['Build a triad on each note of a major scale, using only notes from that scale, and you get the key’s seven **diatonic chords**. Musicians number them with **Roman numerals**: capitals for major, small letters for minor.'] },
    { t: 'staff', h: 'The chords of C major', music: '"C" [C4,E4,G4]q "Dm" [D4,F4,A4]q "Em" [E4,G4,B4]q "F" [F4,A4,C5]q | "G" [G4,B4,D5]q "Am" [A4,C5,E5]q "Bdim" [B4,D5,F5]q "C" [C5,E5,G5]q', p: ['**I ii iii IV V vi vii°**: every major key follows this major–minor pattern. **I**, **IV** and **V** are major; **ii**, **iii** and **vi** are minor; **vii°** is diminished.'] },
    { t: 'quiz', q: 'In C major, which chord is **V**?', opts: ['G', 'F', 'Am'], ans: 0, why: 'G is the 5th note of C major, so G is chord V.' },
    { t: 'quiz', q: 'In C major, **vi** is…', opts: ['A minor', 'A major', 'F major'], ans: 0, why: 'A is the 6th note, and the vi chord is minor.' },
    { t: 'quiz', q: 'In G major, which chord is **IV**?', opts: ['C', 'D', 'Em'], ans: 0, why: 'G A B **C**: C is the 4th note of G major.' },
    { t: 'tip', h: 'Why numerals?', p: ['Numerals describe a progression in **any** key. I–IV–V is C–F–G in C major and G–C–D in G major. Learn the pattern once, play it everywhere.'] },
  ] },
  { id: 'u6l2', u: 6, title: 'I–IV–V and the pop progression', mins: 10, skills: ['prog-classic', 'prog-pop'], songs: ['pop-ballad'], cards: [
    { t: 'text', h: 'Home, away and back', p: ['**I** is home. **IV** moves away gently. **V** builds tension that wants to go home. **I–IV–V–I** is the backbone of folk songs, hymns, blues and rock ’n’ roll.'] },
    { t: 'play', h: 'I–IV–V–I in C', rh: '"C" [C4,E4,G4]w@1,3,5 | "F" [C4,F4,A4]w@1,3,5 | "G" [B3,D4,G4]w@1,2,5 | "C" [C4,E4,G4]w@1,3,5', lh: 'C3w@5 | F2w@5 | G2w@5 | C3w@5', tempo: 72 },
    { t: 'text', h: 'The pop progression', p: ['Shuffle in the minor vi chord and you get **I–V–vi–IV** (C–G–Am–F). Countless hit songs loop these four chords. Start it on vi (**vi–IV–I–V**) and it turns wistful.'] },
    { t: 'play', h: 'Four-Chord Ballad', song: 'pop-ballad', p: ['Right hand plays smooth inversions; left hand plays the roots. Feel the four beats in each chord.'] },
    { t: 'drill', h: 'Build the chords', spec: { k: 'chordbuild', chords: ['C', 'G', 'Am', 'F'], count: 8 } },
  ] },
  { id: 'u6l3', u: 6, title: 'Cadences', mins: 7, skills: ['cadences'], cards: [
    { t: 'text', h: 'Musical punctuation', p: ['A **cadence** is the chord move at the end of a phrase, like punctuation in a sentence:', '- **Perfect** (V–I): a full stop. [[keys:G3 B3 D4|V]] then [[keys:G3 C4 E4|I]]\n- **Plagal** (IV–I): the gentle “A-men” of hymns.\n- **Imperfect** (ends on V): a comma or question mark. It sounds unfinished.\n- **Interrupted** (V–vi): a surprise. You expect home and get the minor vi instead.'] },
    { t: 'play', h: 'Hear the four cadences', rh: '"G" [B3,D4,G4]h "C" [C4,E4,G4]h | "F" [C4,F4,A4]h "C" [C4,E4,G4]h | "C" [C4,E4,G4]h "G" [B3,D4,G4]h | "G" [B3,D4,G4]h "Am" [C4,E4,A4]h', lh: 'G2h C3h | F2h C3h | C3h G2h | G2h A2h', tempo: 60 },
    { t: 'quiz', q: 'Which cadence sounds most finished?', opts: ['Perfect (V–I)', 'Imperfect (ends on V)', 'Interrupted (V–vi)'], ans: 0 },
    { t: 'quiz', q: 'The “Amen” at the end of hymns is a…', opts: ['Plagal cadence (IV–I)', 'Perfect cadence (V–I)', 'Interrupted cadence'], ans: 0 },
  ] },
  { id: 'u6l4', u: 6, title: 'Famous progressions', mins: 10, skills: ['prog-canon', 'prog-blues', 'prog-jazz'], songs: ['canon', 'blues-c'], cards: [
    { t: 'text', h: 'Pachelbel’s Canon', p: ['Johann Pachelbel’s Canon (around 1700) loops eight chords over a slowly falling bass: **I–V–vi–iii–IV–I–IV–V**. Its bass line and chords turn up in songs to this day.'] },
    { t: 'play', h: 'Canon (simplified)', song: 'canon' },
    { t: 'text', h: 'The 12-bar blues', p: ['Twelve bars, three chords, all dominant 7ths: **I I I I | IV IV I I | V IV I V**. It’s the root of blues, rock ’n’ roll and boogie-woogie. Swing the {es} (long-short) for the real feel.'] },
    { t: 'play', h: 'Blues in C', song: 'blues-c' },
    { t: 'text', h: 'ii–V–I', p: ['The jazz musician’s favourite move: **ii7–V7–Imaj7** (Dm7–G7–Cmaj7 in C). Each chord’s root falls a 5th to the next, so it feels like an inevitable slide home: [[chord:Dm7]] [[chord:G7]] [[chord:Cmaj7]]'] },
  ] },
  { id: 'u6l5', u: 6, title: 'Accompaniment patterns', mins: 9, skills: ['accomp'], songs: ['scarborough', 'gymnopedie'], cards: [
    { t: 'text', h: 'Bring chords to life', p: ['Holding chords sounds plain. Real accompaniments add rhythm and movement. Here are four patterns over C–Am–F–G. Learn the shape once and use it under any song.'] },
    { t: 'play', h: 'Steady pulse', rh: '"C" [C4,E4,G4]q [C4,E4,G4]q [C4,E4,G4]q [C4,E4,G4]q | "Am" [C4,E4,A4]q [C4,E4,A4]q [C4,E4,A4]q [C4,E4,A4]q | "F" [C4,F4,A4]q [C4,F4,A4]q [C4,F4,A4]q [C4,F4,A4]q | "G" [B3,D4,G4]q [B3,D4,G4]q [B3,D4,G4]q [B3,D4,G4]q', lh: 'C3w | A2w | F2w | G2w', tempo: 80 },
    { t: 'play', h: 'Root–fifth–octave', clef: 'bass', hand: 'L', music: '"C" C3e@5 G3e@2 C4e@1 G3e C3e G3e C4e G3e | "Am" A2e E3e A3e E3e A2e E3e A3e E3e | "F" F2e C3e F3e C3e F2e C3e F3e C3e | "G" G2e D3e G3e D3e G2e D3e G3e D3e', tempo: 80, p: ['A flowing left hand for ballads: root, 5th, octave, 5th.'] },
    { t: 'play', h: 'Waltz (oom-pah-pah)', time: '3/4', rh: '"C" rq [E4,G4]q [E4,G4]q | "Am" rq [E4,A4]q [E4,A4]q | "F" rq [F4,A4]q [F4,A4]q | "G" rq [D4,G4]q [D4,G4]q', lh: 'C3q rh | A2q rh | F2q rh | G2q rh', tempo: 100, p: ['Bass on beat 1, chord on beats 2 and 3.'] },
  ] },
  { id: 'u6l6', u: 6, title: 'Reading a lead sheet', mins: 9, skills: ['leadsheet'], cards: [
    { t: 'text', h: 'Melody plus chords', p: ['A **lead sheet** shows just the melody with chord symbols above it. You make up the left hand yourself: start with whole-note roots, then try the patterns from the last lesson.'] },
    { t: 'staff', h: 'A lead sheet', time: '3/4', pickup: 1, music: 'G3q | "C" C4h E4e C4e | E4h D4q | "F" C4h A3q | "C" G3h G3q | "C" C4h E4e C4e | "G" E4h D4e E4e | G4h.~ | G4h', p: ['The start of *Amazing Grace* as a lead sheet. Play the melody with your right hand and the chord roots (C, F, G) with your left on beat 1.'] },
    { t: 'play', h: 'Your turn', time: '3/4', pickup: 1, rh: 'G3q | "C" C4h E4e C4e | E4h D4q | "F" C4h A3q | "C" G3h G3q | "C" C4h E4e C4e | "G" E4h D4e E4e | G4h.~ | G4h', lh: 'rq | C3h. | C3h. | F2h. | C3h. | C3h. | G2h. | G2h. | G2h', tempo: 76 },
    { t: 'tip', h: 'Fake it till you make it', p: ['“Fake books” full of lead sheets are how many pianists learn hundreds of songs. With the chords from Units 5 and 6, you can already play from one.'] },
  ] },

  /* ===================== Unit 7: Reading fluently ===================== */
  { id: 'u7l1', u: 7, title: 'Ledger lines and the wider range', mins: 8, skills: ['treble3', 'bass2'], songs: ['blue-danube'], cards: [
    { t: 'staff', h: 'Above the treble staff', music: 'F5q G5q A5q B5q | C6w', labels: true, p: ['Notes keep going above the staff on **ledger lines**. **A** sits on the first ledger line above the treble staff, and **C6 (High C)** on the second.'] },
    { t: 'staff', h: 'Below the bass staff', clef: 'bass', music: 'G2q F2q E2q D2q | C2w', labels: true, p: ['Below the bass staff, **E2** is on the first ledger line and **C2** on the second. Count ledger lines just like staff lines: line, space, line…'] },
    { t: 'drill', h: 'Read the high notes', spec: { k: 'read', ranges: [['treble', 'C4', 'C6']], count: 12 } },
    { t: 'drill', h: 'Read the low notes', spec: { k: 'read', ranges: [['bass', 'C2', 'C4']], count: 12 } },
  ] },
  { id: 'u7l2', u: 7, title: 'More keys and the circle of fifths', mins: 9, skills: ['circle', 'keysig3'], cards: [
    { t: 'text', h: 'The circle of fifths', p: ['Go up a 5th from C and you reach G (1 sharp). Up another 5th: D (2 sharps), then A (3), E (4)… Go *down* a 5th from C and you get F (1 flat), B♭ (2), E♭ (3), A♭ (4). Arranged in a circle, all 12 keys fit like a clock. You can explore it under **Practice → Circle of fifths**.'] },
    { t: 'text', h: 'Quick tricks', p: ['- **Sharp keys:** the last sharp is the 7th note, so the key is a {semi} above it. Last sharp C♯ → **D major**.\n- **Flat keys:** the second-last flat *is* the key. Flats B♭ E♭ A♭ → **E♭ major**. (One flat is F major.)\n- The relative minor is 3 {semis} below the major: C major → A minor, G major → E minor.'] },
    { t: 'drill', h: 'Name the key', spec: { k: 'keysig', keys: ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'], count: 10 } },
    { t: 'quiz', q: 'The relative minor of G major is…', opts: ['E minor', 'D minor', 'B minor'], ans: 0 },
  ] },
  { id: 'u7l3', u: 7, title: 'Ties, syncopation and 6/8', mins: 9, skills: ['rhythm4', 'six8'], songs: ['row-boat', 'entertainer'], cards: [
    { t: 'staff', h: 'Ties', clef: 'rhythm', music: 'xh~ xq xq | xq xh~ xq | xw', p: ['A **tie** joins two notes of the same pitch into one longer sound. Play the first note and hold it through the second. Ties cross bar lines and beats in ways a single note can’t.'] },
    { t: 'staff', h: 'Syncopation', clef: 'rhythm', music: 'xe xq xe xh | xe xq xq xe xq', p: ['**Syncopation** puts accents *between* beats: notes start on an “and” and hold over the next beat. It’s what makes music swing and groove.'] },
    { t: 'drill', h: 'Dotted and off-beat rhythms', spec: { k: 'rhythm', level: 4, count: 3 } },
    { t: 'staff', h: '6/8 time', time: '6/8', clef: 'rhythm', music: 'xe xe xe xe xe xe | xq. xq. | xq xe xq xe | xh.', p: ['In **6/8** there are six {es} per {bar}, felt as **two big beats** of three: **ONE** two three **FOUR** five six. It has a lilting, rocking feel.'] },
    { t: 'play', h: 'Row, Row, Row Your Boat', song: 'row-boat', p: ['A round in 6/8. Feel two big beats in every {bar}.'] },
  ] },
  { id: 'u7l4', u: 7, title: 'The sustain pedal', mins: 7, skills: ['pedal'], songs: ['londonderry'], cards: [
    { t: 'text', h: 'The right pedal', p: ['The right-hand pedal is the **sustain** (or *damper*) pedal. Press it and notes keep ringing after you lift your fingers, which makes music sound full and connected.', 'Keep your heel on the floor and press with the ball of your foot.'] },
    { t: 'text', h: 'Legato pedalling', p: ['The secret is to change the pedal **just after** each new chord:', '- Play the first chord, then press the pedal.\n- Play the next chord. As it sounds, lift the pedal and press it straight back down.\n- Up–down, just *after* the chord. It feels backwards at first.', 'Pedal markings: **Ped.** means press; a ✱ or the end of a bracket means lift.'] },
    { t: 'tip', h: 'Use your ears', p: ['Too much pedal blurs everything into mush. If chords smear into each other, change the pedal more often. If you have a digital piano with a pedal plugged in, Crescendo hears it too.'] },
    { t: 'do', h: 'Try it', steps: ['Play C major, then press the pedal and lift your hand. It keeps ringing.', 'Play C, F, G, C, changing the pedal just after each chord.', 'Listen: each chord should be clear, with no gaps between them.'] },
  ] },
  { id: 'u7l5', u: 7, title: 'Sight-reading', mins: 9, skills: ['sight'], songs: ['fur-elise'], cards: [
    { t: 'text', h: 'Reading something new', p: ['**Sight-reading** is playing music you’ve never seen. It’s a skill of its own, and a few minutes a day makes a huge difference. Before you play, take 30 seconds to check:', '- The **key signature** and **time signature**.\n- The highest and lowest notes: where should your hands sit?\n- Patterns: repeats, scales, chord shapes.\n- The rhythm: tap it first.'] },
    { t: 'text', h: 'Keep going', p: ['The golden rule: **don’t stop for mistakes**. Keep the beat going and skip a note rather than going back. Choose a slow tempo and look a little ahead of where you’re playing.'] },
    { t: 'play', h: 'Read this', music: 'E4q G4q F4q D4q | E4h C4h | D4q F4q E4q G4q | C4w', tempo: 70, p: ['Check it first, then press **In time** and play straight through.'] },
    { t: 'play', h: 'Für Elise (theme)', song: 'fur-elise', p: ['Beethoven’s famous piece (1810), simplified. The E–D♯ wiggle uses fingers 5 and 4.'] },
  ] },

  /* ===================== Unit 8: Musicianship ===================== */
  { id: 'u8l1', u: 8, title: 'Improvising with pentatonics', mins: 9, skills: ['improv'], cards: [
    { t: 'text', h: 'Five notes, no wrong ones', p: ['The **pentatonic scale** has five notes. C major pentatonic is **C D E G A**: the major scale without the two notes that can clash (F and B). Remember the black-key music from your second lesson? That was a pentatonic scale too.'] },
    { t: 'kb', h: 'C major pentatonic', from: 'C4', to: 'B5', labels: 'all', marks: [['C4', '', 'target'], ['D4', '', 'target'], ['E4', '', 'target'], ['G4', '', 'target'], ['A4', '', 'target'], ['C5', '', 'target'], ['D5', '', 'target'], ['E5', '', 'target'], ['G5', '', 'target'], ['A5', '', 'target']], p: ['Make up melodies using only the gold keys. Start and end on C to sound “finished”.'] },
    { t: 'text', h: 'How to improvise', p: ['- Left hand: loop the pop progression, one chord per {bar} (C, G, Am, F).\n- Right hand: noodle on C D E G A. Short phrases, then rest, like talking.\n- Repeat an idea, then change it slightly. Repetition makes it sound intentional.'] },
    { t: 'text', h: 'The blues scale', p: ['For the 12-bar blues, try **C E♭ F F♯ G B♭ C**, the **blues scale**: [[keys:C4 Eb4 F4 F#4 G4 Bb4 C5|hear it]]. Slide from E♭ to E for that classic bluesy sound.'] },
  ] },
  { id: 'u8l2', u: 8, title: 'Minor keys in depth', mins: 9, skills: ['minor2'], songs: ['moonlit-waltz'], cards: [
    { t: 'text', h: 'Three kinds of minor', p: ['- **Natural minor**: straight from the key signature (A B C D E F G A).\n- **Harmonic minor**: raise the 7th (G♯), so chord V becomes major (E) and pulls strongly home.\n- **Melodic minor**: raise the 6th and 7th going up (F♯ G♯), and use the natural minor coming down.'] },
    { t: 'staff', h: 'A harmonic minor', music: 'A3q B3q C4q D4q | E4q F4q G#4q A4q | A4w', labels: true, p: ['That G♯ gives a distinctive, exotic leap between F and G♯.'] },
    { t: 'play', h: 'i–iv–V–i in A minor', rh: '"Am" [C4,E4,A4]w | "Dm" [D4,F4,A4]w | "E" [B3,E4,G#4]w | "Am" [C4,E4,A4]w', lh: 'A2w | D3w | E2w | A2w', tempo: 70 },
    { t: 'play', h: 'Moonlit Waltz', song: 'moonlit-waltz', p: ['An original waltz in A minor: oom-pah-pah in the left hand, a long melody in the right. Notice the G♯ in {bar} 7.'] },
  ] },
  { id: 'u8l3', u: 8, title: 'Playing by ear', mins: 8, skills: ['byear'], cards: [
    { t: 'text', h: 'Figuring out tunes', p: ['Playing by ear is a skill anyone can build. The trick is to work out *direction* and *distance*, one note at a time:', '- Sing the tune. Is the next note higher, lower or the same?\n- Is it a step or a leap?\n- Try it on the piano. Wrong? Go one key up or down.\n- Start with tunes you know well, beginning on C.'] },
    { t: 'drill', h: 'Echo: play it back', spec: { k: 'echo', count: 6, len: 3 } },
    { t: 'drill', h: 'Longer echoes', spec: { k: 'echo', count: 5, len: 4, notes: 5 } },
    { t: 'do', h: 'Work out a tune', steps: ['Pick a simple song you know well (*Happy Birthday*, a nursery rhyme or a jingle).', 'Find the first note by singing and testing keys.', 'Work out the rest of the first line, one note at a time.', 'Play it for someone!'] },
  ] },
  { id: 'u8l4', u: 8, title: 'Write your own music', mins: 9, skills: ['compose'], cards: [
    { t: 'text', h: 'Composing is just choosing', p: ['You already know everything you need to write a piece: a key, a chord progression, a rhythm and a melody made of steps and skips.'] },
    { t: 'text', h: 'An 8-bar recipe', p: ['- **Chords:** pick a progression, such as I–V–vi–IV, twice through.\n- **Rhythm:** clap a simple one-{bar} rhythm and reuse it.\n- **Melody:** on each chord, start on one of its notes, then move by steps.\n- **Shape:** {bars} 1–4 ask a question (end on V); {bars} 5–8 answer it (end on I).'] },
    { t: 'tip', h: 'Keep a record', p: ['Record yourself on your phone, or write the notes in the practice note on Today. Little ideas grow into whole pieces.'] },
    { t: 'do', h: 'Your first piece', steps: ['Choose a key (C major is perfect).', 'Play the chords C–G–Am–F in your left hand, slowly.', 'Make up a right-hand melody over them using the chord notes.', 'Play it three times until it feels like *your* song. Give it a name!'] },
  ] },
  { id: 'u8l5', u: 8, title: 'Where to next?', mins: 6, skills: [], cards: [
    { t: 'text', h: 'Look how far you’ve come', p: ['You can read both clefs, play scales and chords, use progressions, read lead sheets, play hands together and even improvise. That’s a real musician’s toolkit.'] },
    { t: 'text', h: 'Keep growing', p: ['- **Repertoire:** try easy classical pieces (Bach’s *Notebook for Anna Magdalena*, Schumann’s *Album for the Young*) or pop lead sheets.\n- **Technique:** add more scales (all 12 majors, then minors) and arpeggios.\n- **Sight-read** something new every day, even for two minutes.\n- **A teacher** can give feedback no app can. Even a few lessons help.', 'Your daily practice keeps going: Crescendo keeps reviewing what you’ve learned, and every song stays in your library.'] },
    { t: 'do', h: 'Celebrate', steps: ['Play your favourite song from the Songs tab, start to finish.', 'Record it and keep it. Listen again in six months!'] },
  ] },
);

const LESSON_BY_ID = Object.fromEntries(LESSONS.map(l => [l.id, l]));
