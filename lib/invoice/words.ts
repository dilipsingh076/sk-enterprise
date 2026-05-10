const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitsWords(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? ` ${ones[o]}` : "");
}

function threeDigitsWords(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ones[h]} Hundred`);
  if (rest) parts.push(twoDigitsWords(rest));
  return parts.join(rest && h ? " " : "").trim();
}

function integerToWords(num: number): string {
  if (num === 0) return "Zero";
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;
  const parts: string[] = [];
  if (crores) parts.push(`${threeDigitsWords(crores)} Crore`);
  if (lakhs) parts.push(`${threeDigitsWords(lakhs)} Lakh`);
  if (thousands) parts.push(`${threeDigitsWords(thousands)} Thousand`);
  if (hundreds) parts.push(threeDigitsWords(hundreds));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** INR amount in words for invoice footer (e.g. "Two Lakh One Thousand ... Only") */
export function amountInWordsInr(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);
  const rupeeWords = integerToWords(rupees);
  const p = paise ? ` and ${twoDigitsWords(paise)} Paise` : "";
  return `INR ${rupeeWords}${p} Only`;
}
