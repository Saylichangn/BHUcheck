const monthSource = [
  "jan(?:uary)?",
  "feb(?:ruary)?",
  "mar(?:ch)?",
  "apr(?:il)?",
  "may",
  "jun(?:e)?",
  "jul(?:y)?",
  "aug(?:ust)?",
  "sep(?:t(?:ember)?)?",
  "oct(?:ober)?",
  "nov(?:ember)?",
  "dec(?:ember)?",
  "जानेवारी",
  "जाने",
  "फेब्रुवारी",
  "फेब्रु",
  "मार्च",
  "एप्रिल",
  "मे",
  "जून",
  "जुलै",
  "ऑगस्ट",
  "सप्टेंबर",
  "सप्टें",
  "ऑक्टोबर",
  "ऑक्टो",
  "नोव्हेंबर",
  "नोव्हें",
  "डिसेंबर",
  "डिसें",
].join("|");

const dayMonthYear = new RegExp(
  String.raw`\b(\d{1,2})(?:st|nd|rd|th)?[\s\-./]+(${monthSource})[\s\-.,]+(\d{2,4})\b`,
  "i",
);

const monthDayYear = new RegExp(
  String.raw`\b(${monthSource})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b`,
  "i",
);

const isoDate = /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
const numericDate = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/;

export type ParsedDate = {
  iso: string;
  day: number;
  month: number;
  year: number;
  raw: string;
};

function monthNumber(name: string): number | null {
  const lower = name.toLowerCase();
  const english = lower.slice(0, 3);

  if (english === "jan") return 1;
  if (english === "feb") return 2;
  if (english === "mar") return 3;
  if (english === "apr") return 4;
  if (english === "may") return 5;
  if (english === "jun") return 6;
  if (english === "jul") return 7;
  if (english === "aug") return 8;
  if (english === "sep") return 9;
  if (english === "oct") return 10;
  if (english === "nov") return 11;
  if (english === "dec") return 12;

  if (name.startsWith("जाने")) return 1;
  if (name.startsWith("फेब्रु")) return 2;
  if (name.startsWith("मार्च")) return 3;
  if (name.startsWith("एप्रिल")) return 4;
  if (name.startsWith("मे")) return 5;
  if (name.startsWith("जून")) return 6;
  if (name.startsWith("जुलै")) return 7;
  if (name.startsWith("ऑगस्ट")) return 8;
  if (name.startsWith("सप्टें")) return 9;
  if (name.startsWith("ऑक्टो")) return 10;
  if (name.startsWith("नोव्हें")) return 11;
  if (name.startsWith("डिसें")) return 12;

  return null;
}

function fullYear(value: number) {
  if (value >= 100) return value;
  return value <= 49 ? 2000 + value : 1900 + value;
}

function buildDate(
  day: number,
  month: number,
  yearInput: number,
  raw: string,
): ParsedDate | null {
  const year = fullYear(yearInput);

  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1) return null;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (day > daysInMonth) return null;

  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0",
  )}-${String(day).padStart(2, "0")}`;

  return { iso, day, month, year, raw };
}

export function parseDate(input: string): ParsedDate | null {
  const text = input
    .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  const candidates: Array<{
    index: number;
    day: number;
    month: number;
    year: number;
    raw: string;
  }> = [];

  const iso = isoDate.exec(text);

  if (iso) {
    candidates.push({
      index: iso.index,
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
      raw: iso[0],
    });
  }

  const numeric = numericDate.exec(text);

  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const dayFirst = first > 12 || second <= 12;

    candidates.push({
      index: numeric.index,
      day: dayFirst ? first : second,
      month: dayFirst ? second : first,
      year: Number(numeric[3]),
      raw: numeric[0],
    });
  }

  const dayMonth = dayMonthYear.exec(text);

  if (dayMonth) {
    const month = monthNumber(dayMonth[2] ?? "");

    if (month) {
      candidates.push({
        index: dayMonth.index,
        day: Number(dayMonth[1]),
        month,
        year: Number(dayMonth[3]),
        raw: dayMonth[0],
      });
    }
  }

  const monthDay = monthDayYear.exec(text);

  if (monthDay) {
    const month = monthNumber(monthDay[1] ?? "");

    if (month) {
      candidates.push({
        index: monthDay.index,
        day: Number(monthDay[2]),
        month,
        year: Number(monthDay[3]),
        raw: monthDay[0],
      });
    }
  }

  candidates.sort((left, right) => left.index - right.index);

  for (const candidate of candidates) {
    const parsed = buildDate(
      candidate.day,
      candidate.month,
      candidate.year,
      candidate.raw,
    );

    if (parsed) return parsed;
  }

  return null;
}

export function isOlderThanMonths(
  iso: string,
  months: number,
  reference = new Date(),
) {
  const date = new Date(`${iso}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth() - months,
      reference.getUTCDate(),
    ),
  );

  return date.getTime() < cutoff.getTime();
}
