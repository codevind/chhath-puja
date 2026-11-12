export function normalizeMobileNumber(value: string): string {
  const mobile = value.trim().replace(/[\s()-]/g, "");
  if (mobile && !/^(?:\+91)?[0-9]{10}$/.test(mobile)) {
    throw new Error("Enter a 10-digit mobile number, optionally prefixed with +91, or leave it blank.");
  }
  return mobile;
}
