export function formatLastSeen(date?: string | Date): string {
  if (!date) return "offline";

  const now = new Date();
  const last = new Date(date);

  if (isNaN(last.getTime())) return "offline";

  const diffSeconds = Math.floor((now.getTime() - last.getTime()) / 1000);

  if (diffSeconds < 0) return "online";
  
  if (diffSeconds < 60) return "last seen just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours   = Math.floor(diffSeconds / 3600);
  const diffDays    = Math.floor(diffSeconds / 86400);
  const diffWeeks   = Math.floor(diffDays / 7);
  const diffMonths  = Math.floor(diffDays / 30);
  const diffYears   = Math.floor(diffDays / 365);

  // Minutes — 1 to 59 min
  if (diffMinutes < 60) {
    return diffMinutes === 1
      ? "last seen 1 minute ago"
      : `last seen ${diffMinutes} minutes ago`;
  }

  // Hours — 1 to 23 hr
  if (diffHours < 24) {
    return diffHours === 1
      ? "last seen 1 hour ago"
      : `last seen ${diffHours} hours ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return `last seen yesterday at ${last.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Days — 2 to 6 days
  if (diffDays < 7) {
    return `last seen ${diffDays} days ago`;
  }

  // Weeks — 1 to 3 weeks
  if (diffWeeks < 4) {
    return diffWeeks === 1
      ? "last seen 1 week ago"
      : `last seen ${diffWeeks} weeks ago`;
  }

  // Months — 1 to 11 months
  if (diffMonths < 12) {
    return diffMonths === 1
      ? "last seen 1 month ago"
      : `last seen ${diffMonths} months ago`;
  }

  // Years
  return diffYears === 1
    ? "last seen 1 year ago"
    : `last seen ${diffYears} years ago`;
}