const { Client } = require("@opensearch-project/opensearch");
const { fromEnv } = require("@aws-sdk/credential-providers"); // To read AWS credentials automatically

// Initialize OpenSearch Client
const getSearchClient = () => {
  return new Client({
    node: process.env.AWS_OPENSEARCH_ENDPOINT, // e.g., https://search-domain.region.es.amazonaws.com
    auth: {
      credentials: fromEnv(), // Automatically looks for AWS_ACCESS_KEY_ID & SECRET in .env
    },
    // If you are using a self-signed cert or testing locally, uncomment below:
    // ssl: { rejectUnauthorized: false } 
  });
};

// Function for persona-based search with anomaly filtering
const searchInsightsByPersona = async (personaId) => {
  try {
    const client = getSearchClient();
    const indexName = process.env.AWS_OPENSEARCH_INDEX;

    // Translation: "filter: persona_id eq 'X' and status eq 'Y'"
    const query = {
      bool: {
        must: [
          { term: { persona_id: personaId } },
          { term: { status: "Y" } }
        ]
      }
    };

    const searchResults = await client.search({
      index: indexName,
      body: {
        query: query,
        _source: ["insight_id", "data"], // Equivalent to  'select'
        size: 1000 // Equivalent to 'top', adjust as needed
      }
    });

    const results = [];
    
    // OpenSearch returns results in body.hits.hits
    for (const hit of searchResults.body.hits.hits) {
      const source = hit._source;
      let parsedData = [];

      // Logic to handle stringified JSON vs Object
      if (typeof source.data === "string") {
        try {
          parsedData = JSON.parse(source.data);
        } catch (e) {
          console.error("Error parsing data JSON:", e);
          continue;
        }
      } else {
        parsedData = source.data;
      }

      // Filter for anomaly details (Application Logic preserved)
      const filteredData = Array.isArray(parsedData) ? parsedData.filter((item) =>
        item.hasOwnProperty("anomaly_details") && 
        (item.hasOwnProperty("anomaly_details_status") && item.anomaly_details_status === "Y")
      ) : [];

      if (filteredData.length > 0) {
        results.push({
          insight_id: source.insight_id,
          data: filteredData,
        });
      }
    }
    return results;
  } catch (error) {
    console.error("AWS OpenSearch error:", error);
    throw error;
  }
};

// Function for insight ID-based search without filtering
const searchInsightById = async (insightId, index) => {
  try {
    if (!index) throw new Error("Index name is required");

    const client = getSearchClient();
    const cleanInsightId = insightId.replace(/['"]+/g, "");

    // Translation: "insight_id eq ID AND (status eq N OR status eq P)"
    const query = {
      bool: {
        must: [
          { term: { insight_id: cleanInsightId } }
        ],
        should: [
          { term: { status: "N" } },
          { term: { status: "P" } }
        ],
        minimum_should_match: 1 // Ensures at least one of the 'should' clauses is true
      }
    };

    const searchResults = await client.search({
      index: index,
      body: {
        query: query,
        _source: ["insight_id", "data"],
        track_total_hits: true // Equivalent to includeTotalCount
      }
    });

    const results = [];
    for (const hit of searchResults.body.hits.hits) {
      try {
        const source = hit._source;
        let parsedData = typeof source.data === "string"
            ? JSON.parse(source.data)
            : source.data;

        if (!Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }

        results.push({
          insight_id: source.insight_id,
          data: parsedData,
        });
      } catch (e) {
        console.error("Error processing insight data:", e);
        continue;
      }
    }
    return results;
  } catch (error) {
    console.error("AWS OpenSearch error:", error);
    throw error;
  }
};

const updateInsightAnomalySearch = async (data, index) => {
  try {
    if (!data || !index) throw new Error("Data and Index required");

    const documents = Array.isArray(data) ? data : [data];
    const client = getSearchClient();

    // OpenSearch BULK API Format:
    // It requires two lines per document:
    // 1. Action metadata ({ index: { _index: "name", _id: "id" } })
    // 2. The actual document
    const bulkBody = [];

    documents.forEach((doc) => {
      if (!doc.insight_id) throw new Error("Missing insight_id");

      // Action line
      bulkBody.push({ 
        index: { 
          _index: index, 
          _id: doc.insight_id // Using insight_id as the document ID ensures updates overwrite old ones
        } 
      });

      // Data line
      bulkBody.push({
        ...doc,
        data: typeof doc.data === "object" ? JSON.stringify(doc.data) : doc.data,
      });
    });

    if (bulkBody.length === 0) return { success: true, documentsProcessed: 0 };

    // Send bulk request
    const response = await client.bulk({ body: bulkBody });

    if (response.body.errors) {
       console.error("Bulk upload had errors:", JSON.stringify(response.body.items));
       throw new Error("Errors occurred during bulk upload");
    }

    return {
      success: true,
      documentsProcessed: documents.length,
    };
  } catch (error) {
    console.error("Error updating insight anomaly search:", error);
    throw error;
  }
};

const searchInsightDataById = async (insightId, index) => {
  try {
    if (!index || !process.env.AWS_OPENSEARCH_ENDPOINT) {
      console.warn("Missing Index or Endpoint, falling back");
      return [];
    }

    const client = getSearchClient();
    const cleanInsightId = insightId.toString().replace(/['"]+/g, "");

    console.log(`Searching for insight data: insight_id=${cleanInsightId} in index=${index}`);

    const searchResults = await client.search({
      index: index,
      body: {
        query: {
           term: { insight_id: cleanInsightId }
        },
        _source: ["insight_id", "persona_id", "data", "updated_date"],
        size: 50, // Equivalent to top: 50
        track_total_hits: true
      }
    });

    const results = [];
    for (const hit of searchResults.body.hits.hits) {
      try {
        const source = hit._source;
        let parsedData = source.data;

        // CRITICAL FIX: Replace NaN values (same logic as before)
        if (typeof parsedData === "string") {
          const cleanedData = parsedData.replace(/:\s*NaN/g, ": null");
          parsedData = JSON.parse(cleanedData);
        }

        if (!Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }

        results.push({
          insight_id: source.insight_id,
          persona_id: source.persona_id,
          data: parsedData,
          updated_date: source.updated_date,
        });

        console.log(`Found ${parsedData.length} data points for insight ${cleanInsightId}`);
      } catch (e) {
        console.error("Error processing insight data:", e);
        continue;
      }
    }

    console.log(`Total results found: ${results.length}`);
    return results;
  } catch (error) {
    console.error("AWS OpenSearch error for insight data:", error);
    return [];
  }
};

module.exports = {
  searchInsightsByPersona,
  searchInsightById,
  updateInsightAnomalySearch,
  searchInsightDataById,
};