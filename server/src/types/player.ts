export interface IPlayer {
  id: number;
  full_name: string;
  info?: Record<string, unknown>;
  careerStats?: Record<string, unknown>[];
  lastUpdated?: Date;
  [key: string]: unknown; // Allow other fields
}
