import moment, { unitOfTime } from "moment";

export function timeSince(unixTargetDate: number) {
  const now = moment(); // Current time
  const target = moment.unix(unixTargetDate); // Target time
  const duration = moment.duration(now.diff(target));

  if (duration.asSeconds() < 60) {
      return "now";
  } else if (duration.asMinutes() < 60) {
      return `${Math.floor(duration.asMinutes())}m`;
  } else if (duration.asHours() < 24) {
      return `${Math.floor(duration.asHours())}h`;
  } else {
      return `${Math.floor(duration.asDays())}d`;
  }
}

export function formatDuration(value: number, unit?: unitOfTime.Base): string {
  const duration = moment.duration(value, unit);
  
  switch (true)
  {
    case duration.asMilliseconds() < 1000:
      return `${duration.asMilliseconds()}ms`;
    case duration.asSeconds() < 60:
      return `${duration.asSeconds()}s`;
    case duration.asMinutes() < 60:
      return `${duration.asMinutes()}m`;
    case duration.asHours() < 24:
      return `${duration.asHours()}h`;
    default:
      return `${Math.floor(duration.asDays())}d`;
  }
}

/**
 * wait for a specified amount of time
 * @param ms - milliseconds to wait, defaults to 3000ms
 * @returns 
 */
export async function wait(ms: number = 3000): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}