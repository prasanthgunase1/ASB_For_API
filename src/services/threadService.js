const { logger } = require("../utils/logger");
const repository = require("../data/crudRepository");
const { Message } = require('../db/models/message');
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const { endpoints } = require("../config/config");
const fetch = require("node-fetch").default;

/**
 * Save user thread as a workflow
 * @param {Object} params - Thread save parameters
 * @param {string} params.username - Username saving the thread
 * @param {string} params.threadName - Custom name for the thread
 * @param {Array<string>} params.messageIds - IDs of selected messages
 * @param {string} params.userId - ID of the user
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The created workflow
 */

exports.saveUserThread = async (params, options = {}) => {
  const { username, threadName, messageIds, userId, industry, persona,screenType } =
    params;

  try {
    logger.info(
      `Saving thread for user ${username} with ${messageIds.length} messages`
    );

    // Generate a unique workflow ID
    const workflowId = `thread-${uuidv4()}`;

    // Create metadata with thread information
    const metadata = {
      industry,
      persona,
      thread_type: "user_saved",
      user_id: userId,
      original_message_ids: messageIds,
      created_from: "thread_panel",
      creation_date: new Date().toISOString(),
      screen_type: screenType, 
    };

    // Create workflow with empty steps initially
    // Use raw query for Azure SQL Server compatibility
    await sequelize.query(
      `INSERT INTO [USR].[workflows] 
       ([workflow_id], [workflow_name], [created_by], [metadata], [workflow_steps], [timestamp]) 
       VALUES (:workflow_id, :workflow_name, :created_by, :metadata, :workflow_steps, GETDATE())`,
      {
        replacements: {
          workflow_id: workflowId,
          workflow_name: threadName,
          created_by: username,
          metadata: JSON.stringify(metadata),
          workflow_steps: "[]", // Empty array as JSON string
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    // Call the external thread creation API
    try {
      // Extract conversation_id from the first message if available
      const firstMessage = await repository.findById("message", messageIds[0], {
        quiet: true,
      });
      const conversationId = firstMessage?.conversation_id || null;

      const apiPayload = {
        workflow_id: workflowId,
        user_id: userId,
        chat_id: conversationId ? String(conversationId) : null,
        request_ids: messageIds.map((id) => String(id)),
        workflow_name: threadName,
        screen_type: screenType, 
      };

      logger.info(
        `Calling thread creation API ${
          endpoints.threadCreatingAPI
        } with payload: ${JSON.stringify(apiPayload)}`
      );

      const response = await fetch(endpoints.threadCreatingAPI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
        timeout: 120000, // 2 minute timeout
      });
      console.log("Threadservice",response)
      if (!response.ok) {
        const statusText = response.statusText;
        const statusCode = response.status;
        logger.error(
          `Thread creation API call failed: ${statusCode} ${statusText}`
        );

        // Update metadata with failure information even for HTTP errors
        const errorMetadata = {
          ...metadata,
          api_response: {
            success: false,
            message: `API call failed with status: ${statusCode} ${statusText}`,
            workflow_id: workflowId,
          },
          status: "error",
          api_error: true,
          api_error_code: statusCode,
          api_error_message: statusText,
        };

        await sequelize.query(
          `UPDATE [USR].[workflows] 
           SET [metadata] = :metadata
           WHERE [workflow_id] = :workflow_id`,
          {
            replacements: {
              workflow_id: workflowId,
              metadata: JSON.stringify(errorMetadata),
            },
            type: sequelize.QueryTypes.UPDATE,
          }
        );

        // Continue execution even if API call fails - the thread is already saved in our DB
      } else {
        const apiResponse = await response.json();
        logger.info(
          `Thread creation API response: ${JSON.stringify(apiResponse)}`
        );

        // result = {'success': True, 'message': 'Workflow created successfully', 'workflow_id': workflow_id}
        const status = apiResponse.success === false ? "error" : "processing";

        // Update workflow metadata with API response
        const updatedMetadata = {
          ...metadata,
          api_response: apiResponse,
          status: status,
          api_call_timestamp: new Date().toISOString(),
        };

        await sequelize.query(
          `UPDATE [USR].[workflows] 
           SET [metadata] = :metadata
           WHERE [workflow_id] = :workflow_id`,
          {
            replacements: {
              workflow_id: workflowId,
              metadata: JSON.stringify(updatedMetadata),
            },
            type: sequelize.QueryTypes.UPDATE,
          }
        );
      }
    } catch (apiError) {
      logger.error(
        `Error calling thread creation API: ${apiError.message}`,
        apiError
      );
      // Continue execution even if API call fails - the thread is already saved in our DB
    }

    return {
      workflow_id: workflowId,
      workflow_name: threadName,
      created_by: username,
      timestamp: new Date(),
      metadata: metadata,
      workflow_steps: [],
    };
  } catch (error) {
    logger.error(`Error saving thread:`, error);
    throw error;
  }
};

/**
 * Process thread data asynchronously by calling LLM
 * @param {string} workflowId - The workflow ID
 * @param {string} userId - The user ID
 * @param {Array<string>} messageIds - The message IDs to process
 * @param {Object} options - Additional options
 */
exports.processThreadAsync = async (
  workflowId,
  userId,
  messageIds,
  options = {}
) => {
  try {
    logger.info(`Processing thread for workflow ${workflowId}`);

    // First update the workflow status to indicate processing
    await updateWorkflowStatus(workflowId, "processing", options);

    // 1. Fetch the selected messages to build the context
    const messages = await fetchMessageDetails(messageIds);

    // 2. Build a payload for the LLM - simpler format per requirements
    // This will be passed to LLM when we implement it
    const llmPayload = {
      workflow_id: workflowId,
      user_id: userId,
      request_ids: messageIds,
    };

    // 3. Call LLM API to process thread (commented out for now)
    /* 
    const llmResponse = await callLlmForThreadProcessing(llmPayload);
    const workflowSteps = llmResponse.workflow_steps;
    */

    // For now, create a basic workflow step structure without LLM
    // This can be replaced later with the actual LLM response
    const basicWorkflowSteps = messages
      .filter((msg) => msg.sender_type === "user") // Only include user messages as steps
      .map((msg, index) => ({
        step_id: `step_${index + 1}`,
        req_id: msg.id,
        user_query: msg.message,
        sql_query: "", // To be filled by LLM later
        insight: "", // To be filled by LLM later
        chart_type: "",
        variables: {},
        table: [],
        data_source: ["structured"],
        query_type: "Insight",
      }));

    // 4. Update the workflow with the created steps
    await updateWorkflowSteps(workflowId, basicWorkflowSteps, options);

    // 5. Update workflow status to completed
    await updateWorkflowStatus(workflowId, "completed", options);

    logger.info(`Thread processing completed for ${workflowId}`);
  } catch (error) {
    logger.error(`Error processing thread:`, error);
    // Update workflow status to error
    await updateWorkflowStatus(
      workflowId,
      "error",
      {
        error_details: error.message,
      },
      options
    );
  }
};



/**
 * Get all workflows for a specific user
 * @param {string} username - The username to filter by
 * @param {Object} options - Query options (limit, offset, etc.)
 * @returns {Promise<Array<Object>>} Array of workflow objects
 */
exports.getUserWorkflows = async (username, options = {}) => {
  try {
    logger.info(`Fetching workflows for user ${username}`);

    // Use raw query for Azure SQL Server compatibility
    const workflows = await sequelize.query(
      `SELECT 
         workflow_id, workflow_name, created_by, timestamp, metadata
       FROM [USR].[workflows] 
       WHERE created_by = :username
       ORDER BY timestamp DESC`,
      {
        replacements: { username },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Parse metadata JSON for each workflow
    return workflows.map((workflow) => ({
      ...workflow,
      metadata: workflow.metadata ? JSON.parse(workflow.metadata) : null,
      // Add status information
      status: workflow.metadata?.status || "completed",
    }));
  } catch (error) {
    logger.error(`Error fetching user workflows:`, error);
    throw error;
  }
};

/**
 * Trigger a re-run of workflow processing
 * @param {string} workflowId - The workflow ID to re-run
 * @param {string} userId - The user ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Updated workflow with run results
 */
exports.rerunWorkflow = async (workflowId, userId, options = {}) => {
  try {
    logger.info(`Re-running workflow ${workflowId}`);

    // 1. Check if workflow exists
    const workflow = await sequelize.query(
      `SELECT * FROM [USR].[workflows] WHERE [workflow_id] = :workflow_id`,
      {
        replacements: { workflow_id: workflowId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!workflow || workflow.length === 0) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // 2. Update metadata to indicate workflow is being re-run
    const metadata = JSON.parse(workflow[0].metadata || "{}");
    const updatedMetadata = {
      ...metadata,
      rerun_count: (metadata.rerun_count || 0) + 1,
      last_rerun: new Date().toISOString(),
      status: "rerunning",
    };

    await sequelize.query(
      `UPDATE [USR].[workflows] 
       SET [metadata] = :metadata
       WHERE [workflow_id] = :workflow_id`,
      {
        replacements: {
          workflow_id: workflowId,
          metadata: JSON.stringify(updatedMetadata),
        },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // 3. Call the external thread re-run API
    try {
      const apiPayload = {
        workflow_id: workflowId,
        user_id: userId,
      };

      logger.info(
        `Calling thread re-run API with payload: ${JSON.stringify(
          apiPayload
        )}: Endpoint: ${endpoints.threadReRunAPI}`
      );

      const response = await fetch(endpoints.threadReRunAPI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        const statusText = response.statusText;
        const statusCode = response.status;
        logger.error(
          `Thread re-run API call failed: ${statusCode} ${statusText}`
        );

        // Update metadata to indicate API call failed
        const errorMetadata = {
          ...updatedMetadata,
          api_response: {
            success: false,
            message: `API call failed with status: ${statusCode} ${statusText}`,
            workflow_id: workflowId,
          },
          rerun_api_error: true,
          rerun_api_error_code: statusCode,
          rerun_api_error_message: statusText,
          rerun_api_error_timestamp: new Date().toISOString(),
          status: "error",
        };

        await sequelize.query(
          `UPDATE [USR].[workflows] 
           SET [metadata] = :metadata
           WHERE [workflow_id] = :workflow_id`,
          {
            replacements: {
              workflow_id: workflowId,
              metadata: JSON.stringify(errorMetadata),
            },
            type: sequelize.QueryTypes.UPDATE,
          }
        );

        throw new Error(
          `API call failed with status: ${statusCode} ${statusText}`
        );
      }

      const apiResponse = await response.json();
      logger.info(
        `Thread re-run API response: ${JSON.stringify(
          apiResponse
        )},: response: ${JSON.stringify(response)}`
      );

      // This should be an array of results
      const runResults = apiResponse;

      // Determine status based on API response
      const status =
        !Array.isArray(apiResponse) ||
        apiResponse.some((item) => item.success === false)
          ? "error"
          : "completed";

      // Concatenate the response to metadata as required by new.txt
      const finalMetadata = {
        ...updatedMetadata,
        rerun_api_called: true,
        rerun_timestamp: new Date().toISOString(),
        status: status,
        lastRunResults: runResults,
      };

      await sequelize.query(
        `UPDATE [USR].[workflows] 
         SET [metadata] = :metadata
         WHERE [workflow_id] = :workflow_id`,
        {
          replacements: {
            workflow_id: workflowId,
            metadata: JSON.stringify(finalMetadata),
          },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      // 4. Return both the updated workflow and the run results
      const updatedWorkflow = await sequelize.query(
        `SELECT * FROM [USR].[workflows] WHERE [workflow_id] = :workflow_id`,
        {
          replacements: { workflow_id: workflowId },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (updatedWorkflow && updatedWorkflow.length > 0) {
        return {
          workflow: {
            ...updatedWorkflow[0],
            metadata: JSON.parse(updatedWorkflow[0].metadata || "{}"),
            workflow_steps: JSON.parse(
              updatedWorkflow[0].workflow_steps || "[]"
            ),
          },
          runResults: runResults,
        };
      }

      return {
        workflow: workflow[0],
        runResults: runResults,
      };
    } catch (apiError) {
      logger.error(
        `Error calling thread re-run API: ${apiError.message}`,
        apiError
      );

      // Update metadata to indicate API call failed
      const errorMetadata = {
        ...updatedMetadata,
        rerun_api_error: apiError.message,
        rerun_api_error_timestamp: new Date().toISOString(),
        status: "error",
      };

      await sequelize.query(
        `UPDATE [USR].[workflows] 
         SET [metadata] = :metadata
         WHERE [workflow_id] = :workflow_id`,
        {
          replacements: {
            workflow_id: workflowId,
            metadata: JSON.stringify(errorMetadata),
          },
          type: sequelize.QueryTypes.UPDATE,
        }
      );

      throw apiError;
    }
  } catch (error) {
    logger.error(`Error re-running workflow:`, error);
    throw error;
  }
};

// Helper functions

/**
 * Update workflow status in metadata
 * @param {string} workflowId - The workflow ID
 * @param {string} status - The new status
 * @param {Object} additionalInfo - Any additional status information
 * @param {Object} options - Additional options
 */
async function updateWorkflowStatus(
  workflowId,
  status,
  additionalInfo = {},
  options = {}
) {
  try {
    // First get current metadata
    const result = await sequelize.query(
      `SELECT metadata FROM [USR].[workflows] WHERE workflow_id = :workflow_id`,
      {
        replacements: { workflow_id: workflowId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!result || result.length === 0) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Parse existing metadata and add status
    const metadata = JSON.parse(result[0].metadata || "{}");
    metadata.status = status;
    metadata.last_updated = new Date().toISOString();

    // Add any additional info
    Object.assign(metadata, additionalInfo);

    // Update the workflow
    await sequelize.query(
      `UPDATE [USR].[workflows] 
       SET metadata = :metadata, timestamp = GETDATE()
       WHERE workflow_id = :workflow_id`,
      {
        replacements: {
          workflow_id: workflowId,
          metadata: JSON.stringify(metadata),
        },
        type: sequelize.QueryTypes.UPDATE,
      }
    );
  } catch (error) {
    logger.error(`Error updating workflow status:`, error);
    throw error;
  }
}

/**
 * Update workflow steps
 * @param {string} workflowId - The workflow ID
 * @param {Array<Object>} steps - The workflow steps
 * @param {Object} options - Additional options
 */
async function updateWorkflowSteps(workflowId, steps, options = {}) {
  try {
    await sequelize.query(
      `UPDATE [USR].[workflows] 
       SET workflow_steps = :workflow_steps, timestamp = GETDATE()
       WHERE workflow_id = :workflow_id`,
      {
        replacements: {
          workflow_id: workflowId,
          workflow_steps: JSON.stringify(steps),
        },
        type: sequelize.QueryTypes.UPDATE,
      }
    );
  } catch (error) {
    logger.error(`Error updating workflow steps:`, error);
    throw error;
  }
}

/**
 * Fetch message details for the given message IDs
 * @param {Array<string>} messageIds - The message IDs to fetch
 * @returns {Promise<Array<Object>>} Array of message objects
 */
async function fetchMessageDetails(messageIds) {
  try {
    if (!messageIds || messageIds.length === 0) {
      return [];
    }

    // Build a parameterized query with proper SQL injection protection
    const placeholders = messageIds.map((_, idx) => `:id${idx}`).join(",");
    const replacements = {};
    messageIds.forEach((id, idx) => {
      replacements[`id${idx}`] = id;
    });

    const messages = await sequelize.query(
      `SELECT 
         id, conversation_id, message, sender_type, created_at, updated_at, metadata 
       FROM [dbo].[Messages] 
       WHERE id IN (${placeholders})
       ORDER BY created_at ASC`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return messages.map((msg) => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
    }));
  } catch (error) {
    logger.error(`Error fetching message details:`, error);
    throw error;
  }
}

/**
 * Call LLM API to process thread (commented out for future implementation)
 * Following the pattern from agentService.js
 * @param {Object} payload - The payload to send to the LLM
 * @returns {Promise<Object>} LLM response
 */
/*
async function callLlmForThreadProcessing(payload) {
  try {
    // Configure API endpoint based on Azure best practices
    const endpoint = endpoints.threadProcessingAPI || 
      "https://deepthought-dev.tigeranalytics.com/senseai-py-api/thread-process";
    
    // Apply Azure best practices for secure API communication
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-functions-key": process.env.AZURE_FUNCTION_KEY // For Azure Functions authentication
      },
      body: JSON.stringify(payload),
      // Add Azure-specific retry and timeout options
      timeout: 30000, // 30 second timeout
      retry: 3,       // 3 retries
      retryDelay: 1000 // 1 second delay between retries
    });

    if (!response.ok) {
      // Enhanced error logging for Azure diagnostics
      const statusText = response.statusText;
      const statusCode = response.status;
      
      logger.error(`LLM API call failed: ${statusCode} ${statusText}`);
      
      // Different handling based on status code
      if (statusCode >= 500) {
        throw new Error(`LLM service error: ${statusText}`);
      } else if (statusCode === 429) {
        throw new Error("LLM service rate limit exceeded");
      } else {
        throw new Error(`API call failed with status: ${statusCode}`);
      }
    }

    // Handle the response with secure parsing
    const rawResponse = await response.text();
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch (parseError) {
      logger.error("Error parsing LLM response:", parseError);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }

    // Validate expected response format
    if (!parsedResponse || (payload.workflow_id && !parsedResponse.workflow_steps)) {
      throw new Error("Invalid response format from LLM service");
    }

    logger.info("Thread processing LLM call successful");
    return parsedResponse;
  } catch (error) {
    // Apply circuit-breaker pattern for Azure
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      logger.error("LLM service connection timeout - activating circuit breaker");
      // You could implement a circuit breaker here
    }
    
    logger.error("Error calling LLM for thread processing:", error);
    throw error;
  }
}
*/
