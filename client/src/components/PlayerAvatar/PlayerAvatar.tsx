import { ReactNode, useState } from 'react';
import { getPlayerHeadshotUrl } from '../../utils/nbaImages';
import './PlayerAvatar.css';

interface PlayerAvatarProps {
	/** Numeric NBA player id used to build the headshot URL. */
	playerId: number | string | null | undefined;
	/** Rendered when there is no id or the headshot fails to load. */
	fallback?: ReactNode;
	/** Accessible label for the headshot image. */
	alt?: string;
}

/**
 * Renders a player's official NBA headshot, falling back to arbitrary content
 * (e.g. jersey number) when the id is missing or the image fails to load.
 * Each instance tracks its own error state so it is safe to render in a list.
 */
export default function PlayerAvatar({ playerId, fallback = null, alt = 'Player headshot' }: PlayerAvatarProps) {
	const [errored, setErrored] = useState(false);

	if (playerId == null || errored) {
		return <>{fallback}</>;
	}

	return (
		<img
			className="player-avatar-img"
			src={getPlayerHeadshotUrl(playerId)}
			alt={alt}
			onError={() => setErrored(true)}
		/>
	);
}
