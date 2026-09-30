export const BIRTH_KEYS = Object.freeze(['olivia:birth-profile', 'olivia-arcana-user']);
// Birth details and derived charts only. Journal keys are never touched.
export function forgetBirthData(storage) {
 let complete = true;
 for (const key of BIRTH_KEYS) {
  try { storage.removeItem(key); if (storage.getItem(key) !== null) complete = false; }
  catch { complete = false; }
 }
 return complete;
}
export function exportBirthData(storage) {
 return { schemaVersion: 1, stores: Object.fromEntries(BIRTH_KEYS.map(key => [key, storage.getItem(key)])) };
}
