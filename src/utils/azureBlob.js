const { BlobServiceClient } = require("@azure/storage-blob");
const {
  DefaultAzureCredential,
  ManagedIdentityCredential,
} = require("@azure/identity");

const ShortUniqueId = require("short-uuid");

// Replace with your storage account name and container name
const accountName = process.env.AZURE_ACCOUNT_NAME;
const containerName = process.env.AZURE_CONTAINER_NAME;

let blobServiceClient;
if (process.env.USE_MANAGED_IDENTITY === "true") {
  const credential = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);
  blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
} else {
  // Use connection string for local development
  blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
}

const containerClient = blobServiceClient.getContainerClient(containerName);

// Function to upload a file to Azure Blob Storage
const uploadToAzure = async (file, folderPath) => {
  try {
    // Extract the filename and extension
    const originalName = file.originalname;
    const lastDotIndex = originalName.lastIndexOf(".");
    const filename = originalName.substring(0, lastDotIndex);
    const extension = originalName.substring(lastDotIndex + 1);
    const uniqueId = ShortUniqueId().generate();

    // Create the blob name in the format: folderPath/filename-uuid.extension
    const blobName = folderPath
      ? `${folderPath}/${filename}-${uniqueId}.${extension}`
      : `${filename}-${uniqueId}.${extension}`; // Upload to root if no folderPath

    // Get a reference to the block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadOptions = {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    };

    // Upload the file buffer to Azure Blob Storage
    await blockBlobClient.uploadData(file.buffer, uploadOptions);
    console.log(`Blob was uploaded successfully.`);

    return {
      blobName,
      blobUrl: blockBlobClient.url,
    };
  } catch (error) {
    console.error("Azure upload error:", error);
    throw error;
  }
};

module.exports = { uploadToAzure };
