/* Crescendo — Quaver, the app's mascot: a cheerful quaver (an eighth note). Poses: wave, cheer, think, sleep. */
'use strict';

function mascot(pose = 'wave', cls = '') {
  const eyesOpen = `<ellipse class="m-eye" cx="44" cy="80" rx="6.6" ry="7.6"/><ellipse class="m-eye" cx="62.5" cy="74.5" rx="6.6" ry="7.6"/>
    <circle class="m-pupil" cx="${pose === 'think' ? 45.5 : 45}" cy="${pose === 'think' ? 77.5 : 81}" r="3.7"/><circle class="m-pupil" cx="${pose === 'think' ? 64 : 63.5}" cy="${pose === 'think' ? 72 : 75.5}" r="3.7"/>
    <circle class="m-shine" cx="${pose === 'think' ? 46.8 : 46.4}" cy="${pose === 'think' ? 76.2 : 79.6}" r="1.35"/><circle class="m-shine" cx="${pose === 'think' ? 65.3 : 64.9}" cy="${pose === 'think' ? 70.7 : 74.1}" r="1.35"/>`;
  const eyesShut = '<path class="m-line" d="M38.5 80.5q5.5 4.5 11 0M57 75q5.5 4.5 11 0"/>';
  const mouth = {
    wave: '<path class="m-line" d="M48 91.5q7 6.5 14-3"/>',
    cheer: '<path class="m-mouth" d="M47 89.5q8 10.5 16.5-3.2z"/>',
    think: '<ellipse class="m-mouth" cx="56.5" cy="91" rx="3.2" ry="3.6"/>',
    sleep: '<path class="m-line" d="M50 92q5 3 10-1.5"/>',
  }[pose] || '';
  const arms = {
    wave: '<path class="m-arm" d="M27.5 84q-12-6-11.5-21"/><circle class="m-hand" cx="16" cy="61" r="5.4"/>',
    cheer: '<path class="m-arm" d="M27 82q-13-8-12.5-23"/><circle class="m-hand" cx="14.5" cy="57" r="5.4"/><path class="m-arm" d="M83.5 92q14 0 18.5-14"/><circle class="m-hand" cx="103" cy="76" r="5.4"/>',
    think: '<path class="m-arm" d="M30 97q2 9 13 8"/><circle class="m-hand" cx="45" cy="104.5" r="5"/>',
    sleep: '',
  }[pose] || '';
  const extra = {
    cheer: '<path class="m-spark" d="M20 30l2.2 5.3 5.3 2.2-5.3 2.2L20 45l-2.2-5.3-5.3-2.2 5.3-2.2zM104 22l1.6 3.9 3.9 1.6-3.9 1.6-1.6 3.9-1.6-3.9-3.9-1.6 3.9-1.6z"/><circle class="m-dot" cx="40" cy="22" r="3"/><circle class="m-dot2" cx="108" cy="52" r="2.6"/>',
    think: '<text class="m-q" x="18" y="52">?</text>',
    sleep: '<text class="m-z" x="22" y="58">z</text><text class="m-z sm" x="10" y="42">z</text>',
  }[pose] || '';
  return `<svg class="mascot ${pose}${cls ? ' ' + cls : ''}" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse class="m-shadow" cx="54" cy="113" rx="30" ry="4.5"/>
    <g class="m-bob">
      <rect class="m-stem" x="77" y="14" width="7.5" height="74" rx="3.75"/>
      <path class="m-flag" d="M83 15.5c15 4 25 14.5 21.5 33.5-3.2-8.6-10-13.2-21.5-14z"/>
      ${arms}
      <ellipse class="m-body" cx="54" cy="86" rx="30.5" ry="23.5" transform="rotate(-18 54 86)"/>
      <ellipse class="m-sheen" cx="44" cy="76" rx="11" ry="5.5" transform="rotate(-18 44 76)"/>
      ${pose === 'sleep' ? eyesShut : eyesOpen}
      <ellipse class="m-cheek" cx="36.5" cy="92" rx="5.2" ry="3.2"/><ellipse class="m-cheek" cx="71" cy="85" rx="5.2" ry="3.2"/>
      ${mouth}
    </g>
    ${extra}
  </svg>`;
}
