function toLocalDateString(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultPlanDates(today = new Date()) {
  const tomorrow = new Date(today);
  // A calendar day can be 23 or 25 hours when daylight saving time changes.
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    startDate: toLocalDateString(today),
    endDate: toLocalDateString(tomorrow),
  };
}
