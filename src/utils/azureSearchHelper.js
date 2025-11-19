const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");

const getSearchClient = (index) => {
  return new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    index || process.env.AZURE_SEARCH_INDEX,
    new AzureKeyCredential(process.env.AZURE_SEARCH_KEY)
  );
};

// Function for persona-based search with anomaly filtering
const searchInsightsByPersona = async (personaId) => {
  try {
    const client = getSearchClient(process.env.AZURE_SEARCH_INDEX);

    const searchResults = await client.search("*", {
      filter: `persona_id eq '${personaId}' and status eq 'Y'`,
      select: ["insight_id", "data"],
    });

    const results = [];
    for await (const result of searchResults.results) {
      let parsedData = [];
      if (typeof result.document.data === "string") {
        try {
          parsedData = JSON.parse(result.document.data);
        } catch (e) {
          console.error("Error parsing data JSON:", e);
          continue;
        }
      } else {
        parsedData = result.document.data;
      }

      // Filter for anomaly details only for persona-based search
      const filteredData = parsedData.filter((item) =>
        item.hasOwnProperty("anomaly_details") && (item.hasOwnProperty("anomaly_details_status") && item.anomaly_details_status === "Y")
      );

      if (filteredData.length > 0) {
        results.push({
          insight_id: result.document.insight_id,
          data: filteredData,
        });
      }
    }
    return results;
  } catch (error) {
    console.error("Azure Search error:", error);
    throw error;
  }
};

// Function for insight ID-based search without filtering
const searchInsightById = async (insightId, index) => {
  try {
    if (!index) {
      throw new Error("Index name is required for insight search");
    }

    const client = getSearchClient(index);
    const cleanInsightId = insightId.replace(/['"]+/g, "");

    // Modify search to be more permissive
    const searchResults = await client.search("*", {
      filter: `insight_id eq '${cleanInsightId}' and status eq 'N' or  status eq 'P'`,
      select: ["insight_id", "data"],
      includeTotalCount: true,
    });

    const results = [];
    for await (const result of searchResults.results) {

      try {
        let parsedData =
          typeof result.document.data === "string"
            ? JSON.parse(result.document.data)
            : result.document.data;

        // If parsedData is not an array, wrap it in an array
        if (!Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }

        // Add document to results without filtering
        results.push({
          insight_id: result.document.insight_id,
          data: parsedData,
        });
      } catch (e) {
        console.error("Error processing insight data:", {
          error: e.message,
          document: result.document,
        });
        continue;
      }
    }
    return results;
  } catch (error) {
    console.error("Azure Search error:", {
      message: error.message,
      stack: error.stack,
      index,
      insightId,
    });
    throw error;
  }
};

const updateInsightAnomalySearch = async (data, index) => {
  try {
    // Validate input parameters
    if (!data || !index) {
      throw new Error("Both data and index are required for update");
    }

    // Ensure data is an array
    const documents = Array.isArray(data) ? data : [data];

    // Validate document structure
    const validDocuments = documents.map((doc) => {
      // Ensure each document has required fields
      if (!doc.insight_id) {
        throw new Error("Each document must have an insight_id");
      }

      // Convert data to string if it's an object
      return {
        ...doc,
        data:
          typeof doc.data === "object" ? JSON.stringify(doc.data) : doc.data,
      };
    });

    const client = getSearchClient(index);

    // Upload documents in batches of 1000 (Azure Search limit)
    const batchSize = 1000;
    for (let i = 0; i < validDocuments.length; i += batchSize) {
      const batch = validDocuments.slice(i, i + batchSize);
      await client.uploadDocuments(batch);
    }

    return {
      success: true,
      documentsProcessed: validDocuments.length,
    };
  } catch (error) {
    console.error("Error updating insight anomaly search:", {
      message: error.message,
      stack: error.stack,
      index,
      dataLength: data?.length,
    });
    throw new Error(`Failed to update documents: ${error.message}`);
  }
};

const searchInsightDataById = async (insightId, index) => {
  try {
    if (!index) {
      console.warn(
        "Index name is required for insight data search, falling back to SQL execution"
      );
      return [];
    }

    if (!process.env.AZURE_SEARCH_ENDPOINT || !process.env.AZURE_SEARCH_KEY) {
      console.warn(
        "Azure Search credentials not configured, falling back to SQL execution"
      );
      return [];
    }

    const client = getSearchClient(index);
    const cleanInsightId = insightId.toString().replace(/['"]+/g, "");

    console.log(
      `Searching for insight data: insight_id=${cleanInsightId} in index=${index}`
    );

    const searchResults = await client.search("*", {
      filter: `insight_id eq '${cleanInsightId}'`,
      select: ["insight_id", "persona_id", "data", "updated_date"],
      includeTotalCount: true,
      top: 50,
    });

    const results = [];
    for await (const result of searchResults.results) {
      try {
        let parsedData = result.document.data;

        // Parse the data if it's a string
        if (typeof parsedData === "string") {
          // CRITICAL FIX: Replace NaN values with null before parsing JSON
          const cleanedData = parsedData.replace(/:\s*NaN/g, ": null");
          parsedData = JSON.parse(cleanedData);
        }

        // Ensure data is an array
        if (!Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }

        results.push({
          insight_id: result.document.insight_id,
          persona_id: result.document.persona_id,
          data: parsedData,
          updated_date: result.document.updated_date,
        });

        console.log(
          `Found ${parsedData.length} data points for insight ${cleanInsightId}`
        );
      } catch (e) {
        console.error("Error processing insight data:", {
          error: e.message,
          document: result.document,
        });
        continue;
      }
    }

    console.log(
      `Total results found for insight ${cleanInsightId}: ${results.length}`
    );
    return results;
  } catch (error) {
    console.error("Azure Search error for insight data:", error);
    // Return empty array to fall back to SQL execution
    return [];
  }
};

module.exports = {
  searchInsightsByPersona,
  searchInsightById,
  updateInsightAnomalySearch,
  searchInsightDataById,
};
