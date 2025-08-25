// Team utilities and mappings

/**
 * Map team names to logo file names
 */
const TEAM_LOGO_MAP = {
  "Arsenal FC": "arsenal",
  Arsenal: "arsenal",
  "Aston Villa FC": "aston-villa",
  "Aston Villa": "aston-villa",
  "AFC Bournemouth": "bournemouth",
  Bournemouth: "bournemouth",
  "Brentford FC": "brentford",
  Brentford: "brentford",
  "Brighton & Hove Albion FC": "brighton",
  Brighton: "brighton",
  "Burnley FC": "burnley",
  Burnley: "burnley",
  "Chelsea FC": "chelsea",
  Chelsea: "chelsea",
  "Crystal Palace FC": "crystal-palace",
  "Crystal Palace": "crystal-palace",
  "Everton FC": "everton",
  Everton: "everton",
  "Nottingham Forest FC": "forest",
  "Nottingham Forest": "forest",
  "Fulham FC": "fulham",
  Fulham: "fulham",
  "Leeds United FC": "leeds",
  "Leeds United": "leeds",
  "Leicester City FC": "leicester",
  "Leicester City": "leicester",
  "Liverpool FC": "liverpool",
  Liverpool: "liverpool",
  "Manchester City FC": "man-city",
  "Manchester City": "man-city",
  "Manchester United FC": "man-united",
  "Manchester United": "man-united",
  "Newcastle United FC": "newcastle",
  "Newcastle United": "newcastle",
  "Sunderland AFC": "sunderland",
  Sunderland: "sunderland",
  "Tottenham Hotspur FC": "tottenham",
  Tottenham: "tottenham",
  "West Ham United FC": "west-ham",
  "West Ham United": "west-ham",
  "Wolverhampton Wanderers FC": "wolves",
  Wolves: "wolves",
};

/**
 * Get team logo path from team name
 */
export function getTeamLogo(teamName) {
  const logoName = TEAM_LOGO_MAP[teamName];
  if (logoName) {
    return `/team-logos/${logoName}.svg`;
  }

  // Fallback: try to create a logo name from the team name
  const fallbackName = teamName
    .toLowerCase()
    .replace(/fc|united|city|hotspur|wanderers/gi, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `/team-logos/${fallbackName}.svg`;
}

/**
 * Get default team logo path from team name
 */
export function getTeamLogoDefault(teamName) {
  const logoName = TEAM_LOGO_MAP[teamName];
  if (logoName) {
    return `/team-logos/${logoName}-default.svg`;
  }

  // Fallback
  const fallbackName = teamName
    .toLowerCase()
    .replace(/fc|united|city|hotspur|wanderers/gi, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `/team-logos/${fallbackName}-default.svg`;
}

/**
 * Format match date for display
 */
export function formatMatchDate(utcDate) {
  const date = new Date(utcDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays === -1) {
    return "Yesterday";
  } else if (diffDays > 1 && diffDays <= 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Format match time for display
 */
export function formatMatchTime(utcDate) {
  const date = new Date(utcDate);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Check if match has started
 */
export function hasMatchStarted(utcDate) {
  return new Date(utcDate) <= new Date();
}

/**
 * Check if match is finished
 */
export function isMatchFinished(status) {
  return status === "FINISHED";
}

/**
 * Check if match is live
 */
export function isMatchLive(status) {
  return status === "IN_PLAY" || status === "PAUSED";
}

/**
 * Get match status display text
 */
export function getMatchStatusText(status, utcDate) {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return formatMatchTime(utcDate);
    case "IN_PLAY":
      return "LIVE";
    case "PAUSED":
      return "HT"; // Half Time
    case "FINISHED":
      return "FT"; // Full Time
    case "POSTPONED":
      return "PP"; // Postponed
    case "CANCELLED":
      return "CN"; // Cancelled
    case "SUSPENDED":
      return "SU"; // Suspended
    default:
      return formatMatchTime(utcDate);
  }
}

/**
 * Get score display for a match
 */
export function getScoreDisplay(score, status) {
  if (!score || status === "SCHEDULED" || status === "TIMED") {
    return { home: "-", away: "-" };
  }

  if (status === "FINISHED") {
    return {
      home: score.fullTime.home ?? "-",
      away: score.fullTime.away ?? "-",
    };
  }

  // For live matches or halftime
  return {
    home: score.halfTime.home ?? score.fullTime.home ?? "-",
    away: score.halfTime.away ?? score.fullTime.away ?? "-",
  };
}

/**
 * Calculate weeks since season start (for week selector)
 */
export function calculateWeeksSinceSeasonStart() {
  // Premier League typically starts in mid-August
  const seasonStart = new Date("2024-08-17"); // Adjust this for current season
  const now = new Date();
  const diffTime = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, Math.min(diffWeeks, 37)); // 38 gameweeks max
}

/**
 * Get all matchdays for the season
 */
export function getAllMatchdays() {
  return Array.from({ length: 38 }, (_, i) => i + 1);
}
