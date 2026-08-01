export function normalizeAllowedDeviceIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map(item => String(item).trim()).filter(Boolean))];
  }
  if (typeof value === "string") {
    return [...new Set(value.split(/[\n,]/).map(item => item.trim()).filter(Boolean))];
  }
  return [];
}

export function isDeviceAllowed(allowedDeviceIds, deviceId) {
  const normalized = normalizeAllowedDeviceIds(allowedDeviceIds);
  if (normalized.length === 0) {
    return false;
  }
  if (typeof deviceId !== "string") {
    return false;
  }
  return normalized.includes(deviceId.trim());
}
