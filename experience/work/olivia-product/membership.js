// Membership is not on sale yet, so every spread is open to everyone and no
// spread surface mentions it. Turn this on only when a paid offer exists.
export const MEMBERSHIP_LIVE = false;
export const isSpreadFree = id => !MEMBERSHIP_LIVE || id === 'clarity3';
