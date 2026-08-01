type SettingsRecord = Record<string, unknown>;
type SettingsRole = "owner" | "manager" | "employee";

const OPERATIONAL_SETTING_KEYS = [
  "leavesEnabled",
  "autoClockOutEnabled",
  "autoClockOutHourIst",
  "autoClockOutMinuteIst",
  "branches",
] as const;

export function settingsForRole(
  settings: SettingsRecord | null,
  role: SettingsRole,
) {
  if (!settings || role === "owner") return settings;

  return Object.fromEntries(
    OPERATIONAL_SETTING_KEYS.flatMap((key) => (
      Object.hasOwn(settings, key) ? [[key, settings[key]]] : []
    )),
  );
}
