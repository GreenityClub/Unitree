export const formatSessionDuration = (startTime: Date, endTime: Date): string => {
  const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  return formatMinutesToHHMMSS(Math.floor(durationInSeconds / 60));
};

export const formatMinutesToHHMMSS = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const seconds = 0; // We don't show seconds in this format

  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}; 