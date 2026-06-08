import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Activity, Users } from 'lucide-react';
import { api } from '../../api/client';
import { Player } from '../../types/player';
import { getTeamColors } from '../../utils/teamColors';
import { getPlayerHeadshotUrl } from '../../utils/nbaImages';
import './PlayerDetail.css';

function calcAge(birthdate: string): number | null {
	if (!birthdate) return null;
	const birth = new Date(birthdate);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
	return age;
}

function fmtPct(value: number | null | undefined): string {
	if (value == null) return '—';
	return (value * 100).toFixed(1) + '%';
}

function fmtStat(value: number | null | undefined): string {
	if (value == null) return '—';
	return value.toFixed(1);
}

export default function PlayerDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [player, setPlayer] = useState<Player | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [headshotError, setHeadshotError] = useState(false);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setError('');
		api.get<Player>(`/players/${id}`)
			.then(({ data }) => setPlayer(data))
			.catch(() => setError('Failed to load player. Make sure the server is running.'))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<div className="pd-loading">
				<div className="pd-spinner" />
			</div>
		);
	}

	if (error || !player) {
		return (
			<div className="pd-error">
				<p>{error || 'Player not found.'}</p>
				<button className="pd-back-btn" onClick={() => navigate('/')}>
					<ArrowLeft size={16} />
					Back to Home
				</button>
			</div>
		);
	}

	const info = player.info || ({} as Record<string, string>);
	const careerRows = [...(player.careerStats || [])].reverse();
	const latestSeason = careerRows[0];

	const colors = getTeamColors(info.TEAM_ABBREVIATION);
	const age = info.BIRTHDATE ? calcAge(info.BIRTHDATE) : null;
	const birthFormatted = info.BIRTHDATE ? info.BIRTHDATE.split('T')[0] : null;
	const draftText =
		info.DRAFT_YEAR && info.DRAFT_YEAR !== '0'
			? `${info.DRAFT_YEAR} · R${info.DRAFT_ROUND} · Pick ${info.DRAFT_NUMBER}`
			: 'Undrafted';

	return (
		<div className="pd-page">
			<div
				className="pd-header"
				style={{
					background: `linear-gradient(to bottom, color-mix(in srgb, ${colors.primary} 15%, transparent), transparent)`,
				}}
			>
				<div className="pd-container">
					<button className="pd-back-btn" onClick={() => navigate(-1)}>
						<ArrowLeft size={16} />
						Back to Players
					</button>

					<div className="pd-hero">
						<div className="pd-avatar">
							{!headshotError ? (
								<img
									className="pd-avatar-img"
									src={getPlayerHeadshotUrl(player.id)}
									alt={player.full_name || info.DISPLAY_FIRST_LAST || 'Player headshot'}
									onError={() => setHeadshotError(true)}
								/>
							) : (
								info.JERSEY ? `#${info.JERSEY}` : '—'
							)}
						</div>
						<div>
							<h1 className="pd-player-name">
								{player.full_name || info.DISPLAY_FIRST_LAST || 'Unknown Player'}
							</h1>
							<div className="pd-meta">
								<div className="pd-meta-row">
									{info.TEAM_NAME && <span className="pd-meta-item">{info.TEAM_NAME}</span>}
									{info.TEAM_NAME && info.POSITION && <span className="pd-meta-dot">•</span>}
									{info.POSITION && <span className="pd-meta-item">{info.POSITION}</span>}
									{info.JERSEY && <span className="pd-meta-dot">•</span>}
									{info.JERSEY && <span className="pd-meta-item">#{info.JERSEY}</span>}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="pd-container">
				<div className="pd-stats-grid">
					<div
						className="pd-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
					>
						<div className="pd-stat-header">
							<div
								className="pd-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)` }}
							>
								<TrendingUp size={20} style={{ color: colors.primary }} />
							</div>
							<h3 className="pd-stat-label">Points Per Game</h3>
						</div>
						<p className="pd-stat-value">{fmtStat(latestSeason?.PTS)}</p>
						<p className="pd-stat-sublabel">Average points scored</p>
					</div>

					<div
						className="pd-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.secondary} 30%, transparent)` }}
					>
						<div className="pd-stat-header">
							<div
								className="pd-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.secondary} 20%, transparent)` }}
							>
								<Activity size={20} style={{ color: colors.secondary }} />
							</div>
							<h3 className="pd-stat-label">Rebounds Per Game</h3>
						</div>
						<p className="pd-stat-value">{fmtStat(latestSeason?.REB)}</p>
						<p className="pd-stat-sublabel">Average rebounds</p>
					</div>

					<div
						className="pd-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
					>
						<div className="pd-stat-header">
							<div
								className="pd-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)` }}
							>
								<Users size={20} style={{ color: colors.primary }} />
							</div>
							<h3 className="pd-stat-label">Assists Per Game</h3>
						</div>
						<p className="pd-stat-value">{fmtStat(latestSeason?.AST)}</p>
						<p className="pd-stat-sublabel">Average assists</p>
					</div>
				</div>

				<div className="pd-info-grid">
					<div
						className="pd-info-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.secondary} 30%, transparent)` }}
					>
						<h3 className="pd-info-title">Player Information</h3>
						<div className="pd-info-rows">
							<div className="pd-info-row">
								<span className="pd-info-key">Height</span>
								<span className="pd-info-val">{info.HEIGHT || '—'}</span>
							</div>
							<div className="pd-info-row">
								<span className="pd-info-key">Weight</span>
								<span className="pd-info-val">{info.WEIGHT ? `${info.WEIGHT} lbs` : '—'}</span>
							</div>
							{age != null && (
								<div className="pd-info-row">
									<span className="pd-info-key">Age</span>
									<span className="pd-info-val">{age}</span>
								</div>
							)}
							{birthFormatted && (
								<div className="pd-info-row">
									<span className="pd-info-key">Birthdate</span>
									<span className="pd-info-val">{birthFormatted}</span>
								</div>
							)}
							<div className="pd-info-row">
								<span className="pd-info-key">Country</span>
								<span className="pd-info-val">{info.COUNTRY || '—'}</span>
							</div>
							{info.SCHOOL && (
								<div className="pd-info-row">
									<span className="pd-info-key">School</span>
									<span className="pd-info-val">{info.SCHOOL}</span>
								</div>
							)}
							<div className="pd-info-row">
								<span className="pd-info-key">Draft</span>
								<span className="pd-info-val">{draftText}</span>
							</div>
						</div>
					</div>

					<div
						className="pd-info-card pd-info-card--team"
						style={{
							borderColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)`,
							background: `linear-gradient(135deg, color-mix(in srgb, ${colors.primary} 5%, transparent), color-mix(in srgb, ${colors.secondary} 5%, transparent))`,
						}}
					>
						<h3 className="pd-info-title">Team Information</h3>
						<div className="pd-info-rows">
							{info.TEAM_NAME && (
								<div className="pd-info-row">
									<span className="pd-info-key">Team</span>
									<span className="pd-info-val">{info.TEAM_NAME}</span>
								</div>
							)}
							{info.TEAM_ABBREVIATION && (
								<div className="pd-info-row">
									<span className="pd-info-key">Abbreviation</span>
									<span className="pd-info-val">{info.TEAM_ABBREVIATION}</span>
								</div>
							)}
							{info.POSITION && (
								<div className="pd-info-row">
									<span className="pd-info-key">Position</span>
									<span className="pd-info-val">{info.POSITION}</span>
								</div>
							)}
							{info.JERSEY && (
								<div className="pd-info-row">
									<span className="pd-info-key">Jersey</span>
									<span className="pd-info-val">#{info.JERSEY}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				<div
					className="pd-career-card"
					style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
				>
					<h3 className="pd-career-title">Career Stats</h3>
					{careerRows.length === 0 ? (
						<div className="pd-empty">No career stats available.</div>
					) : (
						<div className="pd-table-wrap">
							<table className="pd-table">
								<thead>
									<tr>
										<th>Season</th>
										<th>Team</th>
										<th>GP</th>
										<th>PTS</th>
										<th>REB</th>
										<th>AST</th>
										<th>STL</th>
										<th>BLK</th>
										<th>FG%</th>
										<th>3P%</th>
										<th>FT%</th>
									</tr>
								</thead>
								<tbody>
									{careerRows.map((s, i) => (
										<tr key={i}>
											<td>{s.SEASON_ID}</td>
											<td>{s.TEAM_ABBREVIATION}</td>
											<td>{s.GP ?? '—'}</td>
											<td>{fmtStat(s.PTS)}</td>
											<td>{fmtStat(s.REB)}</td>
											<td>{fmtStat(s.AST)}</td>
											<td>{fmtStat(s.STL)}</td>
											<td>{fmtStat(s.BLK)}</td>
											<td>{fmtPct(s.FG_PCT)}</td>
											<td>{fmtPct(s.FG3_PCT)}</td>
											<td>{fmtPct(s.FT_PCT)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
