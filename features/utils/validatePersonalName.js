const blockedBusinessWords = [
  "ltd",
  "limited",
  "plc",
  "ventures",
  "venture",
  "enterprise",
  "enterprises",
  "company",
  "companies",
  "co",
  "business",
  "services",
  "service",
  "trading",
  "global",
  "group",
  "holdings",
  "holding",
  "solution",
  "solutions",
];

export function validatePersonalName(fullName) {
  if (!fullName) return false;

  const name = fullName.trim().toLowerCase();

  // 1️⃣ Block business keywords
  for (const word of blockedBusinessWords) {
    if (name.includes(word)) {
      return {
        valid: false,
        reason: "BUSINESS_NAME_NOT_ALLOWED",
      };
    }
  }

  // 2️⃣ Allow only alphabets and spaces
  const alphaOnlyRegex = /^[A-Za-z]+(\s[A-Za-z]+){1,2}$/;
  if (!alphaOnlyRegex.test(fullName)) {
    return {
      valid: false,
      reason: "INVALID_NAME_FORMAT",
    };
  }

  // 3️⃣ Prevent single-word names
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) {
    return {
      valid: false,
      reason: "FULL_NAME_REQUIRED",
    };
  }

  return {
    valid: true,
  };
}