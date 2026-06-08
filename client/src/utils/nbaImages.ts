// Helpers for NBA player headshot and team logo images.
//
// Both come from cdn.nba.com — a public CDN that, unlike the stats.nba.com
// endpoints, is NOT IP-blocked. The URLs are deterministic, built purely from
// the numeric IDs already stored on every player/team document, so no backend
// or nightly-ingest changes are needed. Missing images (e.g. brand-new
// players) should be handled by the caller via an <img> onError fallback.

/** Official headshot for a player, keyed on their numeric NBA id. */
export function getPlayerHeadshotUrl(playerId: number | string): string {
	return `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`;
}

/** Primary team logo (SVG), keyed on the franchise's numeric NBA id. */
export function getTeamLogoUrl(teamId: number | string): string {
	return `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`;
}
