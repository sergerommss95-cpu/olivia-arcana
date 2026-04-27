/**
 * missions.ts — Engagement Rewards & Discovery Loops
 * 
 * Defines micro-tasks that reward users for exploring the platform.
 * Closes the 'Ghost Progress' gap by giving visual growth to the user's profile.
 */

export interface Mission {
  id: string;
  label: string;
  description: string;
  points: number;
  icon: string;
}

export const MISSIONS: Mission[] = [
  { 
    id: "first_draw", 
    label: "Break the Silence", 
    description: "Draw your first card from the Oracle.", 
    points: 10, 
    icon: "✦" 
  },
  { 
    id: "study_sun", 
    label: "Solar Enlightenment", 
    description: "Read your full Sun Sign interpretation in the Portrait.", 
    points: 15, 
    icon: "☉" 
  },
  { 
    id: "journal_entry", 
    label: "The Scribe", 
    description: "Record your first reflection in the Cosmic Journal.", 
    points: 20, 
    icon: "✎" 
  },
  { 
    id: "astrolabe_explorer", 
    label: "Celestial Navigator", 
    description: "Interact with 5 different planets in your Birth Chart.", 
    points: 25, 
    icon: "◎" 
  },
];

export function getMissionProgress() {
  if (typeof window === "undefined") return { totalPoints: 0, completedIds: [] };
  
  try {
    const raw = localStorage.getItem("olivia-missions");
    return raw ? JSON.parse(raw) : { totalPoints: 0, completedIds: [] };
  } catch {
    return { totalPoints: 0, completedIds: [] };
  }
}

export function completeMission(id: string) {
  if (typeof window === "undefined") return;
  
  const mission = MISSIONS.find(m => m.id === id);
  if (!mission) return;

  const current = getMissionProgress();
  if (current.completedIds.includes(id)) return;

  const next = {
    totalPoints: current.totalPoints + mission.points,
    completedIds: [...current.completedIds, id]
  };

  localStorage.setItem("olivia-missions", JSON.stringify(next));
  
  // Trigger a global event so the UI (like LivingOliveMark) can bloom
  window.dispatchEvent(new CustomEvent("mission:completed", { detail: mission }));
}
