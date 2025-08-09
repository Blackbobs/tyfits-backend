export function parseArrayInput(val: any): string[] | undefined {
    if (!val && val !== "") return undefined;
    if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
    if (typeof val === "string") {
      return val
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }
    return undefined;
  }