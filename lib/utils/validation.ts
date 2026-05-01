export function requireString(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }
}

export function requireId(value: string, label: string) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
}

export function parsePrice(value: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error("Price must be a valid number greater than or equal to 0.");
  }

  return parsedValue;
}
