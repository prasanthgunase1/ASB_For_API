const helmet = require("helmet");

const isProd = process.env.NODE_ENV === "production";

/**
 * REQUIRED ENV VARIABLES (AWS)
 *
 * AWS_APP_DOMAIN=https://app.mycompany.com
 * AWS_API_DOMAIN=https://api.mycompany.com
 * OKTA_DOMAIN=https://dev-123456.okta.com
 * S3_BUCKET_ENDPOINT=https://my-bucket.s3.ap-south-1.amazonaws.com
 * PYTHON_API_DOMAIN=https://py-api.mycompany.com
 */

const {
  AWS_APP_DOMAIN,
  AWS_API_DOMAIN,
  OKTA_DOMAIN,
  S3_BUCKET_ENDPOINT,
  PYTHON_API_DOMAIN,
} = process.env;

/**
 * Python / External APIs
 * - HTTPS only in production
 * - HTTP allowed ONLY in development
 */
const pythonApis = isProd
  ? [PYTHON_API_DOMAIN]
  : [
      "http://4.188.91.110:8443",
      "http://senseai-python-api.deepthought.svc.cluster.local:8443",
      "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
    ];

/**
 * Localhost allowed ONLY in development
 */
const devOnly = isProd
  ? []
  : ["http://localhost:*", "ws://localhost:*", "wss://localhost:*"];

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      /* -------------------- SCRIPT -------------------- */
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",

        AWS_APP_DOMAIN,
        AWS_API_DOMAIN,
        OKTA_DOMAIN,

        ...pythonApis,

        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://*.tigeranalytics.com",

        "blob:",
        "data:",

        ...devOnly,
      ],

      /* -------------------- STYLE -------------------- */
      styleSrc: [
        "'self'",
        "'unsafe-inline'",

        AWS_APP_DOMAIN,
        AWS_API_DOMAIN,
        OKTA_DOMAIN,

        ...pythonApis,

        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://*.tigeranalytics.com",
      ],

      /* -------------------- FONT -------------------- */
      fontSrc: [
        "'self'",
        "data:",

        AWS_APP_DOMAIN,

        ...pythonApis,

        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",
        "https://*.tigeranalytics.com",
      ],

      /* -------------------- IMAGE -------------------- */
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",

        AWS_APP_DOMAIN,
        AWS_API_DOMAIN,

        ...pythonApis,

        S3_BUCKET_ENDPOINT,
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",

        "https://*.tigeranalytics.com",
      ],

      /* -------------------- CONNECT / API / WS -------------------- */
      connectSrc: [
        "'self'",
        "blob:",

        AWS_API_DOMAIN,
        AWS_APP_DOMAIN,

        `wss://${new URL(AWS_API_DOMAIN).host}`,
        `wss://${new URL(AWS_APP_DOMAIN).host}`,

        OKTA_DOMAIN,

        ...pythonApis,

        S3_BUCKET_ENDPOINT,
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",

        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        "wss:",
        "ws:",

        ...devOnly,
      ],

      /* -------------------- FRAME -------------------- */
      frameSrc: [
        "'self'",
        AWS_APP_DOMAIN,
        OKTA_DOMAIN,

        ...pythonApis,

        "blob:",
      ],

      frameAncestors: ["'self'", AWS_APP_DOMAIN],

      objectSrc: ["'none'"],

      /* -------------------- MEDIA -------------------- */
      mediaSrc: [
        "'self'",
        "blob:",
        "data:",
        AWS_APP_DOMAIN,

        ...pythonApis,

        S3_BUCKET_ENDPOINT,
        "https://*.amazonaws.com",
        "https://s3.amazonaws.com",
      ],

      workerSrc: [
        "'self'",
        "blob:",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
      ],

      /* -------------------- FORM -------------------- */
      formAction: [
        "'self'",
        AWS_APP_DOMAIN,
        AWS_API_DOMAIN,
        OKTA_DOMAIN,
      ],

      manifestSrc: ["'self'"],
      baseUri: ["'self'"],
      childSrc: ["'self'", "blob:"],

      upgradeInsecureRequests: isProd ? [] : null,
    },
  },

  /* -------------------- CORS / COOP / COEP -------------------- */
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

  /* -------------------- SECURITY HEADERS -------------------- */
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,
  hidePoweredBy: true,

  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  dnsPrefetchControl: { allow: false },

  /* -------------------- PERMISSIONS -------------------- */
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

  contentTypeOptions: { nosniff: true },
  frameguard: { action: "sameorigin" },

  hpkp: false,
});
