import mongoose, { Schema, Document } from 'mongoose';
import { ITeam } from '../types/team';

export interface TeamDocument extends ITeam, Document {}

const teamSchema = new Schema<TeamDocument>(
  {
    id: { type: Number, required: true, unique: true },
    full_name: String,
    abbreviation: String,
    roster: [Schema.Types.Mixed],
    stats: Schema.Types.Mixed,
    lastUpdated: Date
  },
  { strict: false }
);

export default mongoose.model<TeamDocument>('Team', teamSchema);
