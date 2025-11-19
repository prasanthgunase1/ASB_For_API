const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob");
const {
  DefaultAzureCredential,
  ManagedIdentityCredential,
} = require("@azure/identity");

const config = require('../config/config')
const accountName = process.env.AZURE_ACCOUNT_NAME;
const containerName = process.env.AZURE_CONTAINER_NAME;

if (!accountName || !containerName) {
  throw new Error(
    "Azure Storage configuration is missing. Please check environment variables."
  );
}

// Use Managed Identity if enabled, otherwise use DefaultAzureCredential
const credential =
  process.env.USE_MANAGED_IDENTITY === "true"
    ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
    : new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

/**
 * Check if a blob exists in Azure Blob Storage
 * @param {string} blobPath - Path of the blob (file name)
 * @returns {Promise<boolean>} - Returns true if exists, false otherwise
 */
exports.checkFileExists = async (blobPath) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobPath);
  return await blobClient.exists();
};

/**
 * Generate a SAS token for secure blob access
 * @param {string} blobPath - Path of the blob (file name)
 * @returns {Promise<string>} - SAS URL of the blob
 */
exports.generateSasToken = async (blobPath) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobPath);

  // Ensure blob exists before generating SAS
  const exists = await blobClient.exists();
  if (!exists) {
    const error = new Error(
      `Blob '${blobPath}' not found in container '${containerName}'.`
    );
    throw error;
  }

  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + config.SAS_TOKEN_EXPIRY_HOURS); // 1-hour expiry

  // Fetch User Delegation Key for Managed Identity
  const userDelegationKey = await blobServiceClient.getUserDelegationKey(
    new Date(),
    expiresOn
  );

  // Generate SAS Token
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse("r"), // Read-only access
      expiresOn,
    },
    userDelegationKey,
    accountName
  ).toString();

  return `${blobClient.url}?${sasToken}`;
};
