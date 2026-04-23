import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const STRICT_RATE_LIMIT_MAX_REQUESTS = 20;

const RATE_LIMIT_WINDOW_SECONDS = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function isStrictEndpoint(pathname) {
  return (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/payment/") ||
    pathname.startsWith("/api/affiliate/payout")
  );
}

async function isRateLimited(key, maxRequests) {
  if (!redis) {
    return { limited: false, retryAfter: 0 };
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > maxRequests) {
      const ttl = await redis.ttl(key);
      const retryAfter = ttl && ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS;
      return { limited: true, retryAfter };
    }

    return { limited: false, retryAfter: 0 };
  } catch (error) {
    // Fail-open to avoid taking down APIs if Redis is temporarily unavailable.
    console.error("Redis rate limit error:", error);
    return { limited: false, retryAfter: 0 };
  }
}

const ALLOWED_COUNTRY = "BD";

function isExcludedFromGeoBlock(pathname) {
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

function geoBlockResponse() {
  return NextResponse.json({ error: "Access denied." }, { status: 403 });
}

function applySecurityHeaders(response) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  return response;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (!isExcludedFromGeoBlock(pathname)) {
    const country = req.headers.get("x-vercel-ip-country");
    if (country && country !== ALLOWED_COUNTRY) {
      return applySecurityHeaders(geoBlockResponse());
    }
  }

  if (!pathname.startsWith("/api/")) {
    return applySecurityHeaders(NextResponse.next());
  }

  const ip = getClientIp(req);
  const strict = isStrictEndpoint(pathname);
  const maxRequests = strict ? STRICT_RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS;
  const rateKey = `rate:${ip}:${pathname}:${req.method}`;
  const { limited, retryAfter } = await isRateLimited(rateKey, maxRequests);

  if (limited) {
    const response = NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set("Retry-After", String(retryAfter));
    return applySecurityHeaders(response);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
