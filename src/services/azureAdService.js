const msal = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");
const {
  TokenCredentialAuthenticationProvider,
} = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
const { ClientSecretCredential } = require("@azure/identity");
const { logger } = require("../utils/logger");
require("isomorphic-fetch");

/**
 * Service to interact with Azure AD through Microsoft Graph API
 */
class AzureAdService {
  constructor() {
    // Use Power BI credentials if dedicated Azure AD credentials are not provided
    this.clientId =
      process.env.AZURE_AD_CLIENT_ID || process.env.POWERBI_CLIENT_ID;
    this.clientSecret =
      process.env.AZURE_AD_CLIENT_SECRET || process.env.POWERBI_CLIENT_SECRET;
    this.tenantId =
      process.env.AZURE_AD_TENANT_ID || process.env.POWERBI_TENANT_ID;
    this.graphClient = null;
  }

  /**
   * Initialize Microsoft Graph client with authentication
   * @returns {Client} Microsoft Graph client
   */
  async initialize() {
    try {
      if (!this.clientId || !this.clientSecret || !this.tenantId) {
        throw new Error("Azure AD credentials are not configured correctly");
      }

      // Create credential for Graph API
      const credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );

      // Create authentication provider
      const authProvider = new TokenCredentialAuthenticationProvider(
        credential,
        {
          scopes: ["https://graph.microsoft.com/.default"],
        }
      );

      // Initialize Microsoft Graph client
      this.graphClient = Client.initWithMiddleware({
        authProvider,
        debugLogging: process.env.NODE_ENV === "development",
      });

      return this.graphClient;
    } catch (error) {
      logger.error("Error initializing Azure AD service:", error);
      throw error;
    }
  }

  /**
   * Get Microsoft Graph client, initializing if needed
   * @returns {Promise<Client>} Microsoft Graph client
   */
  async getClient() {
    if (!this.graphClient) {
      await this.initialize();
    }
    return this.graphClient;
  }

  /**
   * Check Azure AD connection status with minimal query
   * @returns {Promise<Object>} Connection status with details
   */
  async checkConnection() {
    try {
      const client = await this.getClient();

      // Try a minimal permission API call first - getServicePrincipal requires less permissions
      try {
        // Get the app's own information - requires Application.Read.All or less permissions
        const appInfo = await client
          .api(`/servicePrincipals?$filter=appId eq '${this.clientId}'`)
          .get();

        // Successfully connected, but let's check if we have user access permissions
        try {
          // Try to get one user to check permissions
          await client.api("/users").select("id").top(1).get();

          // If we reach here, we have full permissions
          return {
            status: true,
            hasUserReadAccess: true,
            error: null,
            message: "Connected to Azure AD with full user access",
          };
        } catch (userError) {
          // Connection works but we don't have user permissions
          return {
            status: true,
            hasUserReadAccess: false,
            error:
              userError.message || "Insufficient permissions to read users",
            message: "Connected to Azure AD with limited permissions",
          };
        }
      } catch (error) {
        // Even the minimal permission check failed
        logger.error("Azure AD minimal permission check failed:", error);
        return {
          status: false,
          hasUserReadAccess: false,
          error: error.message,
          message:
            "Azure AD authentication succeeded but all permission checks failed",
        };
      }
    } catch (error) {
      logger.error("Azure AD connection check failed:", error);
      return {
        status: false,
        hasUserReadAccess: false,
        error: error.message,
        message: "Could not connect to Azure AD",
      };
    }
  }

  /**
   * Get users from Azure AD with proper pagination handling
   * @param {Object} options Query options
   * @param {number} options.top Number of users to fetch per page
   * @param {number} options.skip Number to skip (handled client-side)
   * @param {string} options.search Search term
   * @param {Array<string>} options.select Fields to select
   * @returns {Promise<Object>} Users data with pagination info
   */
  async getUsers({ top = 50, skip = 0, search = null, select = null } = {}) {
    try {
      // First check if we have permissions to get users
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.status || !connectionStatus.hasUserReadAccess) {
        throw new Error(
          `Azure AD permission issue: ${
            connectionStatus.error || "Insufficient privileges"
          }`
        );
      }

      const client = await this.getClient();

      // Build query - remove $skip param as it's not supported
      let query = client.api("/users");

      // Rest of the method remains unchanged
      // ...existing code...
    } catch (error) {
      logger.error("Error getting users from Azure AD:", error);
      throw error;
    }
  }

  /**
   * Get a specific user from Azure AD
   * @param {string} userId User ID (GUID) or userPrincipalName
   * @returns {Promise<Object>} User data
   */
  async getUser(userId) {
    try {
      const client = await this.getClient();
      const user = await client.api(`/users/${userId}`).get();

      return {
        id: user.id,
        email: user.mail || user.userPrincipalName,
        name: user.userPrincipalName?.split("@")[0] || user.displayName,
        displayName: user.displayName,
        created_at: user.createdDateTime,
        updated_at: null,
        isFromAzureAD: true,
        accountEnabled: user.accountEnabled,
        jobTitle: user.jobTitle,
        department: user.department,
        companyName: user.companyName,
      };
    } catch (error) {
      logger.error(`Error getting user ${userId} from Azure AD:`, error);
      throw error;
    }
  }
}

module.exports = new AzureAdService();
