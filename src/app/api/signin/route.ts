import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { userPrisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { sendEmail } from '@/lib/email';
import { loginNotification } from '@/lib/email-templates';
// Device info will now be provided by the client via src/lib/device.ts

// Alternative token generation function without crypto
function generateSecureToken(userId: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const userIdPart = userId.substring(0, 8);
  const additionalRandom = Math.random().toString(36).substring(2, 10);
  
  // Combine all parts and create a hash-like string
  const combined = `${timestamp}-${randomPart}-${userIdPart}-${additionalRandom}`;
  
  // Convert to a more uniform format (similar to hex but using base36)
  return combined.replace(/[^a-z0-9]/g, '').substring(0, 32);
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const { identifier, password } = formData;
    const clientDeviceInfo = (formData && typeof formData === 'object' ? (formData.deviceInfo || null) : null) as {
      deviceName?: string | null;
      browserName?: string | null;
      ip?: string | null;
      location?: { lat: number; lon: number; city?: string; region?: string; country?: string } | null;
      userAgent?: string | null;
    } | null;

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "All fields are required", success: false },
        { status: 400 }
      );
    }

    // Check if the user exists and their status
    const user = await userPrisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or phone number", success: false },
        { status: 401 }
      );
    }

    // If the account exists but email is not verified / password not set,
    // instruct the client to offer a resend of the set-password link.
    if (user.email && !user.emailVerified) {
      return NextResponse.json(
        { error: 'Email registered but password not set', code: 'EMAIL_UNVERIFIED', email: user.email },
        { status: 200 }
      );
    }

    if (user.suspended) {
      return NextResponse.json(
        { message: "Your account has been suspended", success: false },
        { status: 403 }
      );
    }

    if (user.terminated) {
      return NextResponse.json(
        { message: "Your account has been terminated", success: false },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { message: "Password not set for this account", success: false },
        { status: 401 }
      );
    }

    const isMatched = await compare(password, user.password);
    if (!isMatched) {
      return NextResponse.json(
        { message: "Invalid credentials", success: false },
        { status: 401 }
      );
    }

    // Use device info provided by the client (from src/lib/device.ts)
    const deviceInfo = {
      deviceName: clientDeviceInfo?.deviceName ?? null,
      browserName: clientDeviceInfo?.browserName ?? null,
      ip: clientDeviceInfo?.ip ?? null,
      location: clientDeviceInfo?.location ?? null,
      userAgent: clientDeviceInfo?.userAgent ?? null,
    };
    const location = deviceInfo.location ?? null;

    // Generate a secure random token to represent this session
    const loginToken = generateSecureToken(user.id);

    console.log("loginToken", loginToken);

    // Create a login record in DB for this successful signin
    const loginRecord = await userPrisma.loginRecord.create({
      data: {
        userId: user.id,
        ip: deviceInfo.ip,
        location: location ? {
          lat: location.lat,
          lon: location.lon,
          city: location?.city,
          region: location?.region,
          country: location?.country,
        } : undefined,
        userAgent: `loginToken:${loginToken} | ${deviceInfo.userAgent || ''}`.trim(),
      },
    });

    // Send login notification email with device info
    (async () => {
      try {
        let deviceHtml = '';
        if (deviceInfo) {
          const parts: string[] = [];
          if (deviceInfo.deviceName) parts.push(`<li><strong>Device</strong>: ${escapeHtml(deviceInfo.deviceName)}</li>`);
          if (deviceInfo.browserName) parts.push(`<li><strong>Browser</strong>: ${escapeHtml(deviceInfo.browserName)}</li>`);
          if (location) {
            const locStr = [location.city, location.region, location.country].filter(Boolean).join(', ');
            if (locStr) parts.push(`<li><strong>Location</strong>: ${escapeHtml(locStr)}</li>`);
          }
          if (deviceInfo.userAgent) parts.push(`<li><strong>User Agent</strong>: ${escapeHtml(deviceInfo.userAgent)}</li>`);
          deviceHtml = `<h4 style="margin:12px 0 6px 0">Device details</h4><ul style="margin:0 0 0 16px;">${parts.join('')}</ul>`;
        }

        const when = new Date().toISOString();
        await sendEmail({ 
          to: user.email, 
          subject: 'New sign-in to your Uloons account', 
          html: loginNotification({ userEmail: user.email, when, deviceInfoHtml: deviceHtml }) 
        });
      } catch (e) {
        console.error('Failed to send login notification email', e);
      }
    })();

    // Now proceed with NextAuth signIn
    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
      loginToken,
      loginRecordId: loginRecord.id,
    });

    if (!result || result.error) {
      return NextResponse.json(
        { 
          message: "Invalid credentials", 
          success: false,
          error: result?.error 
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        message: "Login successful", 
        success: true,
        loginRecordId: loginRecord.id,
        loginToken
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        message: "Authentication failed", 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}