export type UserRole = "admin" | "student" | "instructor";

export const ROLES = {
  ADMIN: "admin" as UserRole,
  STUDENT: "student" as UserRole,
  INSTRUCTOR: "instructor" as UserRole,
} as const;

const getCspValue = (): string => {
  const defaultConnectSrc = [
    "'self'",
    "blob:",
    "data:",
    "https://api.cloudinary.com",
    "https://res.cloudinary.com",
    // localhost entries are only needed for local development.
    // In production all API calls go through the same-origin Next.js proxy (/api/*),
    // so 'self' already covers them.
    ...(process.env.NODE_ENV !== "production"
      ? ["http://localhost:5001", "http://127.0.0.1:5001"]
      : []),
  ];
  const apiUrL = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrL) {
    try {
      const origin = new URL(apiUrL).origin;
      if (!defaultConnectSrc.includes(origin)) {
        defaultConnectSrc.push(origin);
      }
    } catch {
      // Skip if not a valid full URL (e.g. when set to "/api" in production)
    }
  }
  return `default-src 'self'; connect-src ${defaultConnectSrc.join(" ")}; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://www.google.com https://www.gstatic.com; worker-src 'self' blob: https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https: https://res.cloudinary.com https://api.cloudinary.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';`;
};

export const SECURITY_CONFIG = {
  // Routes that should be audited when accessed (logs IP and user-agent)
  SENSITIVE_ROUTES: ["/admin", "/dashboard"],

  // Patterns for detecting potential XSS injections in URLs
  XSS_PATTERNS: [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /onload=/i,
    /<iframe/i,
  ],

  // Whitelist of origins allowed to connect to the application
  ALLOWED_ORIGINS: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter(Boolean) as string[],

  // Security Headers for Next.js Headers middleware
  // Provides baseline protection against XSS, Clickjacking, and common data leaks.
  HEADERS: [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-DNS-Prefetch-Control",
      value: "on",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(self), gyroscope=(self), magnetometer=(self)",
    },
    {
      key: "Content-Security-Policy",
      value: getCspValue(),
    },
    {
      key: "X-XSS-Protection",
      value: "1; mode=block",
    },
  ] as { key: string; value: string }[],
} as const;

/**
 * Checks if a string contains any common XSS attack patterns.
 */
export function containsXssPattern(input: string): boolean {
  return SECURITY_CONFIG.XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Checks if a pathname is considered "sensitive" for auditing purposes.
 */
export function isSensitiveRoute(pathname: string): boolean {
  return SECURITY_CONFIG.SENSITIVE_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
}
