// Browser-side helper to collect device/browser/ip/location info.
// Returns a best-effort object and never throws; missing pieces are null.
export type DeviceInfo = {
  deviceName: string | null;
  browserName: string | null;
  ip: string | null;
  location: { lat: number; lon: number; city?: string; region?: string; country?: string } | null;
  userAgent?: string;
};

function detectBrowser(ua: string) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios|opr|edg/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/msie|trident/i.test(ua)) return 'Internet Explorer';
  return 'Unknown';
}

function detectDeviceName(ua: string, platform?: string) {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  if (isMobile) {
    // For mobiles, try to return a friendly name from platform/ua
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android device';
    return 'Mobile device';
  }
  // Map common platform codes to friendly OS names
  if (platform) {
    const p = platform.toLowerCase();
    if (p.includes('win')) return 'Windows';
    if (p.includes('mac')) return 'macOS';
    if (p.includes('linux')) return 'Linux';
    if (p.includes('iphone') || p.includes('ipad')) return 'iOS';
    if (p.includes('android')) return 'Android';
    return platform;
  }
  return 'Desktop';
}

// Best-effort reverse geocoding using OpenStreetMap Nominatim (no API key).
// Returns a small object with city/region/country when available, or null.
async function reverseGeocode(lat: number, lon: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(lat)
    )}&lon=${encodeURIComponent(String(lon))}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = 7000;
    const signal = controller ? controller.signal : undefined;
    const timer = controller
      ? setTimeout(() => controller.abort(), timeout)
      : undefined;

    const res = await fetch(url, { headers: { 'User-Agent': 'uloons-app/1.0 (mailto:admin@example.com)' }, signal } as RequestInit);
    if (timer) clearTimeout(timer);
    if (!res.ok) return null;
    const j = await res.json();
    const addr = j && j.address ? j.address : null;
    if (!addr) return null;
    // pick common fields; fallback to county/state where appropriate
    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || undefined;
    const region = addr.state || addr.county || undefined;
    const country = addr.country || undefined;
    return { city, region, country };
  } catch {
    // best-effort, never throw
    return null;
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    const browserName = detectBrowser(ua);
    const deviceName = detectDeviceName(ua, platform || undefined);

    // get public IP (best-effort)
    let ip: string | null = null;
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      if (r.ok) {
        const j = await r.json();
        ip = j.ip || null;
      }
    } catch {
      ip = null;
    }

    // attempt geolocation first
    let location: DeviceInfo['location'] = null;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          // no explicit clear needed; browser handles
        });
        location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        // attempt reverse-geocoding to get human-readable place names
        try {
          const geo = await reverseGeocode(location.lat, location.lon);
          if (geo) {
            location = { ...location, city: geo.city, region: geo.region, country: geo.country };
          }
        } catch {
          // ignore reverse geocode failures
        }
      } catch {
        console.error('Geolocation failed');
      }
    }

    // fallback to IP-based location lookup if no geolocation
    if (!location) {
      try {
        const r2 = await fetch('https://ipapi.co/json/');
        if (r2.ok) {
          const j2 = await r2.json();
          location = {
            lat: j2.latitude ?? j2.lat ?? 0,
            lon: j2.longitude ?? j2.lon ?? 0,
            city: j2.city,
            region: j2.region,
            country: j2.country_name ?? j2.country,
          };
          if (!ip && j2.ip) ip = j2.ip;
        }
      } catch {
        console.error('IP-based location fetch failed');
      }
    }

  // produce a simplified, human-friendly userAgent description
  const simpleUA = `${browserName}${deviceName ? ' on ' + deviceName : ''}`;
  return { deviceName, browserName, ip, location, userAgent: simpleUA };
        } catch {
        return { deviceName: null, browserName: null, ip: null, location: null };
      }
}
