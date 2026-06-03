export interface ITeam {
  id: number;
  full_name: string;
  abbreviation?: string;
  roster?: Record<string, unknown>[];
  stats?: Record<string, unknown>;
  lastUpdated?: Date;
  [key: string]: unknown; // Allow other fields
}
