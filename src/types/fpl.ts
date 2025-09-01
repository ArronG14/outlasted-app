export interface PLTeam {
  team_id: number;
  name: string;
  short_name: string;
}

export interface Gameweek {
  gw: number;
  deadline_utc: string;
  is_current: boolean;
  is_next: boolean;
  is_finished: boolean;
}

export interface Fixture {
  fixture_id: number;
  gw: number;
  kickoff_utc: string;
  home_team_id: number;
  away_team_id: number;
  home_team?: PLTeam;
  away_team?: PLTeam;
}

export interface NextDeadline {
  gw: number;
  deadline_utc: string;
}