// Server-side helper to collect IP and basic device info from request headers
export type ServerDeviceInfo = {
  ip: string | null;
  userAgent: string | null;
  deviceName: string | null;
  browserName: string | null;
};

export type ServerLocation = {
  lat: number | null;
  lon: number | null;
  city?: string;
  region?: string;
  country?: string;
} | null;

function detectBrowser(ua: string) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios|opr|edg/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/msie|trident/i.test(ua)) return 'Internet Explorer';
  return 'Unknown';
}

function detectDeviceName(ua: string) {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  if (isMobile) {
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android device';
    return 'Mobile device';
  }
  return 'Desktop';
}

export function getServerDeviceInfo(request: Request): ServerDeviceInfo {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const browserName = detectBrowser(userAgent);
    const deviceName = detectDeviceName(userAgent);

    // Get IP from various headers (common in different hosting environments)
    let ip: string | null = null;
    
    // Check for forwarded headers (common in proxy setups)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = forwardedFor.split(',')[0].trim();
    } else {
      // Fallback to other common headers
      const realIp = request.headers.get('x-real-ip');
      if (realIp) {
        ip = realIp;
      } else {
        const clientIp = request.headers.get('x-client-ip');
        if (clientIp) {
          ip = clientIp;
        }
      }
    }

    // If no IP found in headers, we'll need to get it from an external service
    // This will be handled in the API route if needed

    return {
      ip,
      userAgent,
      deviceName,
      browserName,
    };
  } catch {
    return {
      ip: null,
      userAgent: null,
      deviceName: null,
      browserName: null,
    };
  }
}

// Function to get IP from external service if not available in headers
export async function getPublicIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
  } catch {
    console.error('Failed to get public IP');
  }
  return null;
}

// Coarse geolocation lookup from IP (best-effort). Returns null on failure.
export async function getLocationFromIP(ip: string | null): Promise<ServerLocation> {
  try {
    // If IP not provided, try to fetch reader IP-based location directly
    const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : 'https://ipapi.co/json/';
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const lat = j.latitude ?? j.lat ?? null;
    const lon = j.longitude ?? j.lon ?? null;
    const city = j.city ?? undefined;
    const region = j.region ?? j.state ?? undefined;
    const country = j.country_name ?? j.country ?? undefined;
    if (lat == null || lon == null) return { lat: null, lon: null, city, region, country };
    return { lat, lon, city, region, country };
  } catch {
    return null;
  }
}
