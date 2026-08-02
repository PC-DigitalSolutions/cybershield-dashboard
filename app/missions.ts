// Completed-mission registry. Each mission is a text-free rollup produced by
// the backend archiver (scripts/archive_wc2026.py) and committed under
// /missions. Add a new mission here when its rollup lands — the dashboard's
// "Completed Missions" panel renders whatever is in this list.
import wc2026 from "../missions/wc2026.json";

export type Mission = {
  id: string;
  name: string;
  status: "complete" | "active";
  window: string;
  generated_at: string;
  headline: {
    stories_collected: number;
    usage_events: number;
    goalie_chat_turns: number;
    community_intel_hit_rate: number;
    threats_assessed?: number;
    site_visits?: number;
    feedback_responses?: number;
  };
  scam_types: Record<string, number>;
  languages: Record<string, number>;
  activity_by_day: Record<string, number>;
};

// Newest first.
export const MISSIONS: Mission[] = [wc2026 as Mission];
