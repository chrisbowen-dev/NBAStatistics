import mongoose, { Schema, Document } from 'mongoose';
import { IPlayer } from '../types/player';

export interface PlayerDocument extends IPlayer, Document {}

const playerSchema = new Schema<PlayerDocument>(
  {
    id: { type: Number, required: true, unique: true },
    full_name: String,
    info: Schema.Types.Mixed,
    careerStats: [Schema.Types.Mixed],
    lastUpdated: Date
  },
  { strict: false }
);

export default mongoose.model<PlayerDocument>('Player', playerSchema);
