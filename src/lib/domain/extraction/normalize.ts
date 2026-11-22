const devanagariDigits = "०१२३४५६७८९";

const independentVowels: Record<string, string> = {
  अ: "a",
  आ: "aa",
  इ: "i",
  ई: "ee",
  उ: "u",
  ऊ: "oo",
  ऋ: "ri",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
};

const matras: Record<string, string> = {
  "ा": "a",
  "ि": "i",
  "ी": "i",
  "ु": "u",
  "ू": "u",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
};

const consonants: Record<string, string> = {
  क: "k",
  ख: "kh",
  ग: "g",
  घ: "gh",
  ङ: "n",
  च: "ch",
  छ: "chh",
  ज: "j",
  झ: "jh",
  ञ: "n",
  ट: "t",
  ठ: "th",
  ड: "d",
  ढ: "dh",
  ण: "n",
  त: "t",
  थ: "th",
  द: "d",
  ध: "dh",
  न: "n",
  प: "p",
  फ: "ph",
  ब: "b",
  भ: "bh",
  म: "m",
  य: "y",
  र: "r",
  ल: "l",
  व: "v",
  श: "sh",
  ष: "sh",
  स: "s",
  ह: "h",
  ळ: "l",
};

const clusters: Record<string, string> = {
  क्ष: "ksh",
  ज्ञ: "gn",
  त्र: "tr",
  श्र: "shr",
};

export function toAsciiDigits(value: string) {
  return value.replace(/[०-९]/g, (digit) =>
    String(devanagariDigits.indexOf(digit)),
  );
}

export function normalizeText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanValue(value: string) {
  return normalizeText(value)
    .replace(/\s+/g, " ")
    .replace(/^[\s:\-–—]+/, "")
    .replace(/[\s:\-–—]+$/, "")
    .slice(0, 500);
}

export function devanagariToLatin(value: string) {
  const text = normalizeText(value);
  let out = "";

  for (let index = 0; index < text.length; index += 1) {
    const pair = text.slice(index, index + 2);

    if (clusters[pair]) {
      out += clusters[pair];
      index += 1;
      continue;
    }

    const char = text[index];

    if (consonants[char]) {
      out += consonants[char];
      const next = text[index + 1];

      if (next && matras[next]) {
        out += matras[next];
        index += 1;
      } else if (next === "्") {
        index += 1;
      } else {
        out += "a";
      }

      continue;
    }

    if (independentVowels[char]) {
      out += independentVowels[char];
      continue;
    }

    if (matras[char]) {
      out += matras[char];
      continue;
    }

    if (char === "ं" || char === "ँ") {
      out += "n";
      continue;
    }

    if (char === "ः") {
      out += "h";
      continue;
    }

    if (char === "्") {
      continue;
    }

    out += char;
  }

  return out;
}

export function foldName(value: string) {
  return devanagariToLatin(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(?:shri|smt|mr|mrs|late)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((token) => {
      const normalized = token
        .replace(/aa/g, "a")
        .replace(/ee/g, "i")
        .replace(/oo/g, "u")
        .replace(/w/g, "v")
        .replace(/y/g, "i");

      return normalized.length > 3
        ? normalized.replace(/a$/, "")
        : normalized;
    })
    .sort()
    .join(" ");
}

const identifierPrefixes = [
  /^(?:GAT|SURVEY|CTS|PLOT)\s*(?:NO\.?|NUMBER)?\s*[:\-.]?\s*/i,
  /^S\.?\s*NO\.?\s*[:\-.]?\s*/i,
  /^(?:गट|सर्व्हे|भूमापन|भूखंड)\s*(?:क्र\.?|क्रमांक)?\s*[:\-.]?\s*/,
  /^स\.?\s*नं\.?\s*[:\-.]?\s*/,
  /^क्रमांक\s*[:\-.]?\s*/,
];

function stripIdentifierPrefixes(value: string) {
  let current = value;

  for (let pass = 0; pass < 4; pass += 1) {
    let next = current;

    for (const pattern of identifierPrefixes) {
      next = next.replace(pattern, "");
    }

    if (next === current) break;
    current = next;
  }

  return current;
}

export function normalizedIdentifier(value: string) {
  return stripIdentifierPrefixes(toAsciiDigits(value))
    .toUpperCase()
    .replace(/[^A-Z0-9/]+/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "")
    .split("/")
    .map((part) => part.replace(/^0+(?=\d)/, ""))
    .join("/");
}

export function normalizedRegistration(value: string) {
  return toAsciiDigits(value)
    .toUpperCase()
    .replace(
      /^(?:REG(?:ISTRATION)?|DOC(?:UMENT)?|दस्त|नोंदणी)\s*(?:NO\.?|NUMBER|क्र\.?|क्रमांक)?\s*[:\-.]?\s*/,
      "",
    )
    .replace(/[^A-Z0-9/]+/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

export function levenshtein(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

export type NameVerdict = "match" | "possible_variant" | "mismatch";

export function nameVerdict(left: string, right: string): NameVerdict {
  const foldedLeft = foldName(left);
  const foldedRight = foldName(right);

  if (!foldedLeft || !foldedRight) return "mismatch";
  if (foldedLeft === foldedRight) return "match";

  const shortest = Math.min(foldedLeft.length, foldedRight.length);
  const allowed = shortest < 5 ? 0 : shortest < 8 ? 1 : 2;

  return levenshtein(foldedLeft, foldedRight) <= allowed
    ? "possible_variant"
    : "mismatch";
}
