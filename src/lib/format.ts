const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatDate(value: Date) {
  return dateFormatter.format(value);
}

export function formatDateTime(value: Date) {
  return dateTimeFormatter.format(value);
}

export function plural(
  count: number,
  singular: string,
  pluralForm = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
