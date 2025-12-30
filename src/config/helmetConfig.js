const helmet = require("helmet");

/**
 * Helmet Security Configuration for AWS + Okta (NO PowerBI, NO Microsoft Graph, NO Azure domains)
 *
 * ✅ Replace these dummy values later:
 *   - <AWS_API_DOMAIN>          (example: https://api.yourdomain.com)
 *   - <AWS_APP_DOMAIN>          (example: https://app.yourdomain.com)
 *   - <OKTA_DOMAIN>             (example: https://dev-123456.okta.com)
 *   - <S3_BUCKET_ENDPOINT>      (example: https://your-bucket.s3.ap-south-1.amazonaws.com)
 */

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      // -----------------------------
      // Scripts
      // -----------------------------
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",

        "<AWS_API_DOMAIN>",
        "<AWS_APP_DOMAIN>",

        // Okta
        "<OKTA_DOMAIN>",

        // Python APIs (keep if you use them)
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // CDN (keep if used)
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        // Org domains (optional)
        "https://*.tigeranalytics.com",

        "blob:",
        "data:",

        ...(process.env.NODE_ENV === "development"
          ? ["http://localhost:*", "ws://localhost:*"]
          : []),
      ],

      // -----------------------------
      // Styles
      // -----------------------------
      styleSrc: [
        "'self'",
        "'unsafe-inline'",

        "<AWS_API_DOMAIN>",
        "<AWS_APP_DOMAIN>",
        "<OKTA_DOMAIN>",

        // Python APIs
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // CDN
        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        "https://*.tigeranalytics.com",
      ],

      // -----------------------------
      // Fonts
      // -----------------------------
      fontSrc: [
        "'self'",
        "data:",

        "<AWS_APP_DOMAIN>",

        // Python APIs
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",

        "https://*.tigeranalytics.com",
      ],

      // -----------------------------
      // Images (include S3)
      // -----------------------------
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",

        "<AWS_APP_DOMAIN>",
        "<AWS_API_DOMAIN>",

        // Python APIs
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // AWS S3 (exact bucket endpoint goes here)
        "<S3_BUCKET_ENDPOINT>",
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",

        "https://*.tigeranalytics.com",
      ],

      // -----------------------------
      // API / Fetch / WebSocket (include Okta + S3)
      // -----------------------------
      connectSrc: [
        "'self'",
        "blob:",

        "<AWS_API_DOMAIN>",
        "<AWS_APP_DOMAIN>",

        // If you use socket.io on same domain:
        "wss://<AWS_API_DOMAIN>",
        "wss://<AWS_APP_DOMAIN>",

        // Okta token / auth calls
        "<OKTA_DOMAIN>",

        // Python APIs
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
        "wss://deepthought-dev.tigeranalytics.com",

        // AWS S3
        "<S3_BUCKET_ENDPOINT>",
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",

        // CDN
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        // WebSockets (generic)
        "wss:",
        "ws:",

        ...(process.env.NODE_ENV === "development"
          ? ["http://localhost:*", "ws://localhost:*", "wss://localhost:*"]
          : []),
      ],

      // -----------------------------
      // Frames (Okta login pages / hosted sign-in)
      // -----------------------------
      frameSrc: [
        "'self'",
        "<AWS_APP_DOMAIN>",
        "<OKTA_DOMAIN>",

        // Python APIs (only if you iframe them)
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        "blob:",
      ],

      // -----------------------------
      // Who can embed YOUR site
      // -----------------------------
      frameAncestors: ["'self'", "<AWS_APP_DOMAIN>"],

      objectSrc: ["'none'"],

      // -----------------------------
      // Media (include S3)
      // -----------------------------
      mediaSrc: [
        "'self'",
        "blob:",
        "data:",
        "<AWS_APP_DOMAIN>",

        // Python APIs
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // AWS S3
        "<S3_BUCKET_ENDPOINT>",
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",
      ],

      workerSrc: ["'self'", "blob:", "https://unpkg.com", "https://cdn.jsdelivr.net"],

      // -----------------------------
      // Form posts (include Okta if needed)
      // -----------------------------
      formAction: [
        "'self'",
        "<AWS_APP_DOMAIN>",
        "<AWS_API_DOMAIN>",
        "<OKTA_DOMAIN>",
      ],

      manifestSrc: ["'self'"],
      baseUri: ["'self'"],

      childSrc: ["'self'", "blob:"],

      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
    },
  },

  // Keep permissive for cross-origin asset loads (S3/CDN/Python)
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // If you face issues with embedding / wasm / some libs, set false
  crossOriginEmbedderPolicy: false,

  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,

  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  hidePoweredBy: true,
  dnsPrefetchControl: { allow: false },

  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      camera: ["'none'"],
      microphone: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"],
      autoplay: ["'self'"],
      battery: ["'none'"],
      fullscreen: ["'self'"],
      gamepad: ["'none'"],
      midi: ["'none'"],
      notifications: ["'none'"],
      speaker: ["'self'"],
      "sync-xhr": ["'none'"],
      vibrate: ["'none'"],
      "web-share": ["'none'"],
      "xr-spatial-tracking": ["'none'"],
    },
  },

  hpkp: false,

  contentTypeOptions: { nosniff: true },

  frameguard: { action: "sameorigin" },
});
