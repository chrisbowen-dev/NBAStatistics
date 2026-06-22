import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getTeamLogoUrl } from '../../utils/nbaImages';
import './TeamsDropdown.css';

interface Props {
	teams: string[];
	teamIdMap: Record<string, number>;
	selected: string[];
	onToggle: (team: string) => void;
}

export default function TeamsDropdown({ teams, teamIdMap, selected, onToggle }: Props) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
	const wrapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const visible = teams.filter(t =>
		t.toLowerCase().includes(search.toLowerCase())
	);

	const triggerLabel = selected.length === 0
		? 'All teams'
		: `${selected.length} selected`;

	return (
		<div className="tdd-wrap" ref={wrapRef}>
			<button
				className={`tdd-trigger${open ? ' tdd-trigger--open' : ''}`}
				onClick={() => setOpen(v => !v)}
			>
				<span>{triggerLabel}</span>
				<ChevronDown size={11} />
			</button>

			{open && (
				<div className="tdd-menu">
					<div className="tdd-search-wrap">
						<input
							autoFocus
							className="tdd-search"
							placeholder="Search teams..."
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
					</div>
					<div className="tdd-list">
						{visible.map(abbr => {
							const teamId = teamIdMap[abbr];
							const isSelected = selected.includes(abbr);
							const hasLogo = !!teamId && !logoErrors.has(abbr);

							return (
								<div
									key={abbr}
									className={`tdd-item${isSelected ? ' tdd-item--selected' : ''}`}
									onClick={() => onToggle(abbr)}
								>
									<div className="tdd-logo-slot">
										{hasLogo ? (
											<img
												src={getTeamLogoUrl(teamId)}
												alt={abbr}
												className="tdd-logo-img"
												onError={() => setLogoErrors(prev => new Set(prev).add(abbr))}
											/>
										) : (
											<span className="tdd-logo-placeholder">{abbr}</span>
										)}
									</div>
									<span className="tdd-abbr">{abbr}</span>
									<div className="tdd-check">
										{isSelected && '✓'}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{selected.length > 0 && (
				<div className="tdd-tags">
					{selected.map(abbr => {
						const teamId = teamIdMap[abbr];
						const hasLogo = !!teamId && !logoErrors.has(abbr);
						return (
							<div key={abbr} className="tdd-tag">
								<div className="tdd-tag-logo">
									{hasLogo ? (
										<img
											src={getTeamLogoUrl(teamId)}
											alt={abbr}
											className="tdd-logo-img"
											onError={() => setLogoErrors(prev => new Set(prev).add(abbr))}
										/>
									) : (
										<span className="tdd-logo-placeholder">{abbr}</span>
									)}
								</div>
								{abbr}
								<span
									className="tdd-tag-remove"
									onClick={e => { e.stopPropagation(); onToggle(abbr); }}
								>✕</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
