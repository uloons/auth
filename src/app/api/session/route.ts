import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '*';
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        user: session?.user ?? null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true", // 🔥 This is crucial!
        },
      }
    );
  } catch (error) {
    console.error("Session fetch error:", error);
    
    const origin = request.headers.get('origin') || '*';
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        user: null,
        error: "Failed to fetch session",
      }),
      {
        status: 500, // Changed to 500 for actual errors
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
}

// Preflight handler for browsers
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true", // 🔥 This is crucial!
    },
  });
}