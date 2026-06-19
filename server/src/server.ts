import dotenv from 'dotenv';
import dns from 'dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import playerRoutes from './routes/players';
import teamRoutes from './routes/teams';

dotenv.config();

// Comcast's IPv6 DNS refuses TCP SRV queries from Node.js; use Google DNS in dev only
if (process.env.NODE_ENV !== 'production') {
	dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const app = express();
app.disable('etag');
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
