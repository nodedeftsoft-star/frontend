/**
 * Formats a timestamp (in milliseconds) to a readable date string
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted date string like "March 11, 2025 10:35PM"
 */
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid date";
  }

  const date = new Date(timestamp);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  // Add leading zero to minutes if needed
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${month} ${day}, ${year} ${hours}:${minutesStr}${ampm}`;
};

/**
 * Formats a timestamp to a short date string
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted date string like "Mar 11, 2025"
 */
export const formatShortDate = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid date";
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const month = shortMonths[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};

/**
 * Formats a timestamp to time only
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted time string like "10:35PM"
 */
export const formatTime = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid time";
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Invalid time";
  }

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${hours}:${minutesStr}${ampm}`;
};

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago", "3 days ago")
 * @param timestamp - Timestamp in milliseconds
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid date";
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  } else {
    return formatShortDate(timestamp);
  }
};
