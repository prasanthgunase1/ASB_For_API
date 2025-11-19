const helmet = require("helmet");

/**
 * Helmet Security Configuration for Azure Production Deployment
 * Optimized for PowerBI, MicroStrategy, WebSocket support, and Python APIs
 * @version 3.2.0 - Azure Production Ready with PowerBI Embedding Fix
 */

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for PowerBI and MicroStrategy dynamic scripts
        "'unsafe-eval'", // Required for PowerBI SDK and chart libraries

        // PRODUCTION: Your Azure backend domain
        "https://deepthought.tigeranalyticstest.in",

        // Python API URLs
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // CDN resources
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        // PowerBI domains - ENHANCED for embedding fix
        "https://*.powerbi.com",
        "https://app.powerbi.com",
        "https://api.powerbi.com",
        "https://msit.powerbi.com",
        "https://powerbi.microsoft.com",
        "https://*.msecnd.net",
        "https://*.analysis.windows.net",
        "*.powerbi.com", // Wildcard format for better compatibility
        "*.analysis.windows.net",
        "*.microsoftonline.com",
        "*.visualstudio.com",

        // Microsoft authentication and services
        "https://*.microsoftonline.com",
        "https://login.microsoftonline.com",
        "https://*.visualstudio.com",

        // MicroStrategy domains
        "https://*.microstrategy.com",
        "https://autotrial.microstrategy.com",

        // Azure domains
        "https://*.azurewebsites.net",
        "https://*.windows.net",

        // Your organization domains
        "https://*.tigeranalytics.com",
        "https://sso.deepthought.tigeranalyticstest.in",
        "https://deepthought-dev.tigeranalytics.com",

        // Office and document viewers
        "https://view.officeapps.live.com",
        "https://docs.google.com",
        "https://play.google.com",

        // Google services
        "https://*.google.com",
        "https://*.googleusercontent.com",

        // Blob and data URLs
        "blob:",
        "data:",

        // Development support - conditionally included
        ...(process.env.NODE_ENV === "development"
          ? ["http://localhost:*", "ws://localhost:*"]
          : []),
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for PowerBI and MicroStrategy dynamic styling

        // PRODUCTION: Your Azure backend domain
        "https://deepthought.tigeranalyticstest.in",

        // Python API URLs for styles
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // External stylesheets
        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        // PowerBI styles - ENHANCED
        "https://*.powerbi.com",
        "https://*.msecnd.net",
        "*.powerbi.com", // Wildcard format for better compatibility

        // MicroStrategy styles
        "https://*.microstrategy.com",
        "https://autotrial.microstrategy.com",

        // Office and document viewers
        "https://view.officeapps.live.com",
        "https://docs.google.com",
        "https://play.google.com",

        // Google services
        "https://*.google.com",

        // Your organization domains
        "https://*.tigeranalytics.com",
      ],

      fontSrc: [
        "'self'",
        "data:",

        // PRODUCTION: Your Azure backend domain
        "https://deepthought.tigeranalyticstest.in",

        // Python API URLs for fonts
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // Google Fonts
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",

        // PowerBI fonts - ENHANCED
        "https://*.powerbi.com",
        "https://*.msecnd.net",
        "*.powerbi.com", // Wildcard format for better compatibility

        // MicroStrategy fonts
        "https://*.microstrategy.com",

        // Your organization domains
        "https://*.tigeranalytics.com",
      ],

      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:", // Allow all HTTPS images for PowerBI compatibility

        // PRODUCTION: Your Azure backend domain
        "https://deepthought.tigeranalyticstest.in",

        // Python API URLs for images
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // Azure and Windows services
        "https://*.windows.net",
        "https://*.azurewebsites.net",
        "https://*.blob.core.windows.net",
        "https://devdeepthoughtstorage.blob.core.windows.net",

        // PowerBI images and assets - ENHANCED
        "https://*.powerbi.com",
        "https://*.msecnd.net",
        "https://*.microsoftonline.com",
        "*.powerbi.com",
        "*.msecnd.net",

        // MicroStrategy images
        "https://*.microstrategy.com",
        "https://autotrial.microstrategy.com",

        // Office and document viewers
        "https://view.officeapps.live.com",
        "https://docs.google.com",
        "https://play.google.com",

        // Google services
        "https://*.google.com",
        "https://*.googleusercontent.com",

        // Your organization and development tools
        "https://*.tigeranalytics.com",
        "https://*.visualstudio.com",

        // Fonts and external assets
        "https://fonts.gstatic.com",
      ],

      connectSrc: [
        "'self'",
        "blob:",

        // CRITICAL: Your production backend domain with WebSocket support
        "https://deepthought.tigeranalyticstest.in",
        "wss://deepthought.tigeranalyticstest.in",

        "https://graph.microsoft.com",

        // Python API connections - CRITICAL FOR YOUR USE CASE
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
        "wss://deepthought-dev.tigeranalytics.com",

        // Azure and Windows services
        "https://*.windows.net",
        "https://*.azurewebsites.net",
        "https://*.blob.core.windows.net",
        "https://devdeepthoughtstorage.blob.core.windows.net",

        // PowerBI API connections - CRITICAL FOR EMBEDDING FIX
        "https://api.powerbi.com",
        "https://app.powerbi.com",
        "https://*.powerbi.com",
        "https://analysis.windows.net",
        "https://*.analysis.windows.net",
        "*.powerbi.com", // Wildcard format for better compatibility
        "*.analysis.windows.net",
        "*.microsoftonline.com",

        // Microsoft authentication and services
        "https://*.microsoftonline.com",
        "https://login.microsoftonline.com",
        "https://*.visualstudio.com",

        // MicroStrategy connections
        "https://*.microstrategy.com",
        "https://autotrial.microstrategy.com",

        // Your organization domains
        "https://*.tigeranalytics.com",
        "https://sso.deepthought.tigeranalyticstest.in",
        "https://deepthought-dev.tigeranalytics.com",

        // Office and external services
        "https://view.officeapps.live.com",
        "https://docs.google.com",
        "https://*.google.com",
        "https://play.google.com",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",

        // WebSocket support for real-time features - Azure optimized
        "wss://*.tigeranalytics.com",
        "wss://*.azurewebsites.net",
        "wss:",
        "ws:",

        // Development support - conditionally included
        ...(process.env.NODE_ENV === "development"
          ? ["http://localhost:*", "ws://localhost:*", "wss://localhost:*"]
          : []),
      ],

      // CRITICAL: PowerBI iframe embedding - ENHANCED for hanging fix
      frameSrc: [
        "'self'",

        // PRODUCTION: Your Azure backend domain
        "https://deepthought.tigeranalyticstest.in",

        // Python API frame sources (if needed for iframe embedding)
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // PowerBI iframe embedding - CRITICAL FOR EMBEDDING FIX
        "https://app.powerbi.com",
        "https://*.powerbi.com",
        "https://msit.powerbi.com",
        "https://powerbi.microsoft.com",
        "*.powerbi.com", // Wildcard format for better compatibility
        "*.analysis.windows.net",
        "*.microsoftonline.com",

        // Microsoft authentication
        "https://*.microsoftonline.com",
        "https://login.microsoftonline.com",

        // MicroStrategy iframe embedding
        "https://*.microstrategy.com",
        "https://autotrial.microstrategy.com",

        // Your organization SSO and domains
        "https://sso.deepthought.tigeranalyticstest.in",
        "https://*.tigeranalytics.com",
        "https://deepthought-dev.tigeranalytics.com",

        // Office and document viewers
        "https://view.officeapps.live.com",
        "https://docs.google.com",
        "https://play.google.com",
        "https://*.google.com",

        // Azure services
        "https://*.azurewebsites.net",
        "https://*.windows.net",

        // Blob support for file viewing
        "blob:",
      ],

      // CRITICAL: Allow embedding PowerBI - ENHANCED for hanging fix
      frameAncestors: [
        "'self'",

        // Allow embedding in your organization's domains
        "https://sso.deepthought.tigeranalyticstest.in",
        "https://*.tigeranalytics.com",
        "https://deepthought.tigeranalyticstest.in",
        "*.tigeranalytics.com",
        "*.tigeranalyticstest.in",

        // PowerBI embedding contexts - CRITICAL
        "https://app.powerbi.com",
        "https://*.powerbi.com",
        "*.powerbi.com",

        // Office and document viewers
        "https://view.officeapps.live.com",
        "https://docs.google.com",
        "https://play.google.com",

        // Azure services
        "https://*.azurewebsites.net",
      ],

      objectSrc: ["'none'"], // Security best practice - prevents plugin execution

      mediaSrc: [
        "'self'",
        "blob:",
        "data:",

        // PRODUCTION: Your Azure backend domain
        "https://deepthought.tigeranalyticstest.in",

        // Python API media sources
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // Azure Storage for media files
        "https://*.windows.net",
        "https://*.blob.core.windows.net",
        "https://devdeepthoughtstorage.blob.core.windows.net",

        // PowerBI media content
        "https://*.powerbi.com",
        "https://*.msecnd.net",

        // Your organization domains
        "https://*.tigeranalytics.com",
      ],

      workerSrc: [
        "'self'",
        "blob:",

        // Python API worker sources (if using web workers)
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        // CDN workers
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://docs.google.com",

        // PowerBI workers
        "https://*.powerbi.com",

        // Your production domain
        "https://deepthought.tigeranalyticstest.in",
      ],

      formAction: [
        "'self'",
        // Allow form submissions to your backend
        "https://deepthought.tigeranalyticstest.in",
        // Authentication endpoints
        "https://sso.deepthought.tigeranalyticstest.in",
        "https://*.microsoftonline.com",
        "https://login.microsoftonline.com",

        // Python API form actions (if forms submit to Python APIs)
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
      ],

      // Additional security directives for modern browsers
      manifestSrc: ["'self'"],
      baseUri: ["'self'"],

      // Child source for compatibility
      childSrc: [
        "'self'",
        "blob:",
        "https://deepthought.tigeranalyticstest.in",

        // Python API child sources
        "http://4.188.91.110:8443",
        "http://senseai-python-api.deepthought.svc.cluster.local:8443",
        "https://deepthought-dev.tigeranalytics.com/senseai-py-api",

        "https://*.powerbi.com",
        "https://*.microstrategy.com",
      ],

      // CRITICAL: Upgrade insecure requests only in production
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
    },
  },

  // CRITICAL: Cross-origin policies essential for PowerBI embedding fix
  crossOriginResourcePolicy: {
    policy: "cross-origin", // Required for PowerBI and MicroStrategy embedding
  },

  // CRITICAL: Disable for PowerBI embedding - ESSENTIAL FOR FIXING HANGING
  crossOriginEmbedderPolicy: false,

  crossOriginOpenerPolicy: {
    policy: "same-origin-allow-popups", // Required for authentication flows
  },

  // Security headers
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true, // Prevents IE from opening downloads in the context of your site

  // Referrer policy for privacy while maintaining functionality
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // HSTS configuration for HTTPS enforcement - Azure optimized
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Additional security headers
  hidePoweredBy: true, // Hide Express.js signature
  dnsPrefetchControl: { allow: false }, // Disable DNS prefetching for privacy

  // Permissions Policy for enhanced security (modern browsers)
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
      autoplay: ["'self'"], // Allow autoplay for PowerBI videos
      battery: ["'none'"],
      fullscreen: ["'self'"], // Allow fullscreen for dashboards
      gamepad: ["'none'"],
      midi: ["'none'"],
      notifications: ["'none'"],
      payment: ["'none'"],
      speaker: ["'self'"], // Allow audio for PowerBI reports
      "sync-xhr": ["'none'"], // Block synchronous XHR for performance
      vibrate: ["'none'"],
      "web-share": ["'none'"],
      "xr-spatial-tracking": ["'none'"],
    },
  },

  // Azure-specific optimizations
  hpkp: false, // Disable HPKP as Azure handles certificate pinning

  // Content type options
  contentTypeOptions: {
    nosniff: true,
  },

  // Frame options for Azure deployment - ADJUSTED for PowerBI
  frameguard: {
    action: "sameorigin",
  },
});
