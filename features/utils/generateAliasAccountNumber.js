export function generateAliasAccountNumber(phoneNumber) {
  // remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");

  // if 10+ digits → use last 10 digits
  if (cleaned.length >= 10) {
    return cleaned.slice(-10);
  }

  // if less than 10 digits → pad with random numbers
  const missing = 10 - cleaned.length;
  const pad = Array(missing)
    .fill(0)
    .map(() => Math.floor(Math.random() * 10))
    .join("");

  return pad + cleaned;
}