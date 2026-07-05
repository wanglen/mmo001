let cachedVersion = null;

/** @returns {Promise<string | null>} */
export async function fetchAppVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const res = await fetch('/api/version');
    if (!res.ok) return null;
    const data = await res.json();
    cachedVersion = typeof data.version === 'string' ? data.version : null;
  } catch {
    cachedVersion = null;
  }

  return cachedVersion;
}

export function formatVersionLabel(version) {
  return version ? `v${version}` : '';
}
