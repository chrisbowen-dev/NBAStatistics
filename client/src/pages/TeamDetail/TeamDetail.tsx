import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Users } from 'lucide-react';
import { api } from '../../api/client';
import { TeamDetail as TeamDetailType, RosterPlayer } from '../../types/team';
import { getTeamColors } from '../../utils/teamColors';
import { getTeamLogoUrl } from '../../utils/nbaImages';
import PlayerAvatar from '../../components/PlayerAvatar/PlayerAvatar';
import './TeamDetail.css';

export default function TeamDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [team, setTeam] = useState<TeamDetailType | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [logoError, setLogoError] = useState(false);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setError('');
		api.get<TeamDetailType>(`/teams/${id}`)
			.then(({ data }) => setTeam(data))
			.catch(() => setError('Failed to load team. Make sure the server is running.'))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<div className="td-loading">
				<div className="td-spinner" />
			</div>
		);
	}

	if (error || !team) {
		return (
			<div className="td-error">
				<p>{error || 'Team not found.'}</p>
				<button className="td-back-btn" onClick={() => navigate('/')}>
					<ArrowLeft size={16} />
					Back to Home
				</button>
			</div>
		);
	}

	const stats = team.currentSeasonStats;
	const wins = stats.W ?? 0;
	const losses = stats.L ?? 0;
	const winPercentage = stats.W_PCT != null ? (stats.W_PCT * 100).toFixed(1) : null;

	const roster: RosterPlayer[] = (team.roster || []) as RosterPlayer[];
	const colors = getTeamColors(team.abbreviation);

	return (
		<div className="td-page">
			<div
				className="td-header"
				style={{
					background: `linear-gradient(to bottom, color-mix(in srgb, ${colors.primary} 15%, transparent), transparent)`,
				}}
			>
				<div className="td-container">
					<button className="td-back-btn" onClick={() => navigate('/')}>
						<ArrowLeft size={16} />
						Back to Teams
					</button>

					<div className="td-hero">
						<div className="td-logo">
							{!logoError ? (
								<img
									className="td-logo-img"
									src={getTeamLogoUrl(team.id)}
									alt={`${team.full_name} logo`}
									onError={() => setLogoError(true)}
								/>
							) : (
								team.abbreviation
							)}
						</div>
						<div>
							<h1 className="td-team-name">{team.full_name}</h1>
							<div className="td-meta">
								<div className="td-meta-row">
									<span className="td-meta-item">{team.city}, {team.state}</span>
									<span className="td-meta-dot">•</span>
									<span className="td-meta-item">Est. {team.year_founded}</span>
								</div>
								<div className="td-meta-row">
									<span className="td-meta-item">{team.abbreviation}</span>
								</div>
								{(team.standings?.conference != null && team.standings?.division != null) && (
									<div className="td-meta-row">
										<span className="td-meta-item">{team.standings.conference}</span>
										<span className="td-meta-dot">•</span>
										<span className="td-meta-item">{team.standings.division}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="td-container">
				<div className="td-stats-grid">
					<div
						className="td-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
					>
						<div className="td-stat-header">
							<div
								className="td-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)` }}
							>
								<Trophy size={20} style={{ color: colors.primary }} />
							</div>
							<h3 className="td-stat-label">Wins</h3>
						</div>
						<p className="td-stat-value">{wins}</p>
						<p className="td-stat-sublabel">Total victories</p>
					</div>

					<div
						className="td-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.secondary} 30%, transparent)` }}
					>
						<div className="td-stat-header">
							<div
								className="td-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.secondary} 20%, transparent)` }}
							>
								<TrendingUp size={20} style={{ color: colors.secondary }} />
							</div>
							<h3 className="td-stat-label">Win Percentage</h3>
						</div>
						<p className="td-stat-value">{winPercentage != null ? `${winPercentage}%` : '—'}</p>
						<p className="td-stat-sublabel">Season win rate</p>
					</div>

					<div
						className="td-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
					>
						<div className="td-stat-header">
							<div
								className="td-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)` }}
							>
								<Users size={20} style={{ color: colors.primary }} />
							</div>
							<h3 className="td-stat-label">Roster Size</h3>
						</div>
						<p className="td-stat-value">{roster.length}</p>
						<p className="td-stat-sublabel">Active players</p>
					</div>
				</div>

				<div className="td-roster-card">
					<h3 className="td-roster-title">
						<Users size={20} />
						Team Roster
					</h3>

					{roster.length === 0 ? (
						<div className="td-empty">No players available for this team</div>
					) : (
						<div className="td-roster-grid">
							{roster.map((player, i) => (
								<button
									key={player.PLAYER_ID ?? i}
									onClick={() => navigate(`/players/${player.PLAYER_ID}`)}
									className="td-player-btn"
								>
									<div className="td-player-inner">
										<div className="td-player-avatar">
											<PlayerAvatar
												playerId={player.PLAYER_ID}
												alt={player.PLAYER}
												fallback={`#${player.NUM || '–'}`}
											/>
										</div>
										<div className="td-player-info">
											<div className="td-player-top-row">
												<span className="td-player-name">{player.PLAYER}</span>
												<span className="td-player-pos">{player.POSITION}</span>
											</div>
											<div className="td-player-stats">
												<div>
													<span className="td-player-stat-key">Age: </span>
													<span className="td-player-stat-val">{player.AGE}</span>
												</div>
												<div>
													<span className="td-player-stat-key">Acq: </span>
													<span className="td-player-stat-val">{player.HOW_ACQUIRED}</span>
												</div>
											</div>
										</div>
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
