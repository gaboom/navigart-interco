// Placeholder icons for each feature (24x24, stroke-based, currentColor). Replace the paths later without touching the layout.
const P = {
  study: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 11h6"/>',
  browse: '<path d="M5 3v18"/><path d="M5 4h14l-3.5 4.5L19 13H5"/>',
  quiz: '<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1.1-1.4 2.1"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>',
  medico: '<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M12 7.5v9M7.5 12h9"/>',
  interco: '<circle cx="12" cy="12" r="1.8"/><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
  train: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4M8.5 21.5h7"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>',
};

export function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

// Navigation entries. `soon` entries are placeholders for later versions. COLREG is deliberately absent (draft only).
export const FEATURES = [
  { id: 'study', label: 'Study', href: '#/study', icon: 'study' },
  { id: 'browse', label: 'Browse', href: '#/browse', icon: 'browse' },
  { id: 'quiz', label: 'Quiz', href: '#/quiz', icon: 'quiz' },
  { id: 'medico', label: 'Medico', href: '#/medico', icon: 'medico' },
  { id: 'interco', label: 'Interco', href: '#/interco', icon: 'interco' },
  { id: 'train', label: 'Train', icon: 'train', soon: 'v2' },
];
