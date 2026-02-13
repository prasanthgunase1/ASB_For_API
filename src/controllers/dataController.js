const { connectSnowflake } = require("../config/database");
const statusCodes = require("../utils/statusCodes");

// Define Schema Constants
const DB_NAME = "SANDBOX_AI_BI";
const APP_SCHEMA = `${DB_NAME}.APP_SCHEMA`;
const INFO_SCHEMA = `${DB_NAME}.INFORMATION_SCHEMA`; // For table lookups

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const execute = (conn, sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error("❌ Snowflake Query Error:", err.message);
          return reject(err);
        }
        resolve(rows);
      },
    });
  });
};

const mapToLowerCase = (rows) => {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key.toLowerCase()] = row[key];
    }
    return newRow;
  });
};

const safeStringify = (data) => {
  if (typeof data === "object" && data !== null) {
    return JSON.stringify(data);
  }
  return data;
};

const safeParse = (data) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data || {};
};

class DataController {
  
  // ----------------------------------------------------------------
  // KPI Operations
  // ----------------------------------------------------------------
  async updateKpis(req, res) {
    const { kpi, persona_id, persona } = req.body;

    if (!kpi || !persona_id || !persona) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: kpi, persona_id, persona",
      });
    }

    try {
      const conn = await connectSnowflake();
      const kpiString = safeStringify(kpi);

      const query = `
        UPDATE ${APP_SCHEMA}.PERSONA
        SET KPIS = ?, UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE PERSONA_ID = ? AND PERSONA = ?
      `;

      await execute(conn, query, [kpiString, parseInt(persona_id, 10), persona.toString()]);

      res.json({
        success: true,
        message: "KPIs updated successfully",
      });
    } catch (error) {
      console.error("Error in updateKpis:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPersona(req, res) {
    const { persona_id } = req.query;

    if (!persona_id) {
      return res.status(400).json({ success: false, error: "persona_id is required" });
    }

    try {
      const conn = await connectSnowflake();
      const query = `SELECT KPIS FROM ${APP_SCHEMA}.PERSONA WHERE PERSONA_ID = ?`;
      
      const rows = await execute(conn, query, [persona_id]);
      const result = mapToLowerCase(rows)[0];

      res.json({
        success: true,
        data: result ? safeParse(result.kpis) : {},
      });
    } catch (error) {
      console.error("Error in getPersona:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ----------------------------------------------------------------
  // Task Operations
  // ----------------------------------------------------------------
  async getTask(req, res) {
    const { task_id } = req.query;
    if (!task_id) return res.status(400).json({ success: false, error: "task_id is required" });

    try {
      const conn = await connectSnowflake();
      const query = `SELECT TASK_ID, STATUS, RESULT FROM ${APP_SCHEMA}.TASK WHERE TASK_ID = ?`;
      
      const rows = await execute(conn, query, [task_id]);
      const result = mapToLowerCase(rows)[0];
      
      // Parse result JSON if it exists
      if (result && result.result) {
        result.result = safeParse(result.result);
      }

      res.json({ success: true, data: result || {} });
    } catch (error) {
      console.error("Error in getTask:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createTask(req, res) {
    const { task_id, user_id, chat_id, status } = req.body;

    if (!task_id || !user_id || !chat_id || !status) {
      return res.status(400).json({ success: false, error: "Required fields missing" });
    }

    try {
      const conn = await connectSnowflake();
      const query = `
        INSERT INTO ${APP_SCHEMA}.TASK (TASK_ID, USER_ID, CHAT_ID, STATUS, CREATED_AT, UPDATED_AT)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
      `;

      await execute(conn, query, [task_id, user_id, chat_id, status]);

      res.json({
        success: true,
        message: "Task created successfully",
        data: { task_id, user_id, chat_id, status },
      });
    } catch (error) {
      console.error("Error in createTask:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateTask(req, res) {
    const { task_id, status, result } = req.body;
    if (!task_id || !status) return res.status(400).json({ success: false, error: "task_id and status required" });

    try {
      const conn = await connectSnowflake();
      
      const query = `
        UPDATE ${APP_SCHEMA}.TASK
        SET STATUS = ?, RESULT = ?, UPDATED_AT = CURRENT_TIMESTAMP()
        WHERE TASK_ID = ?
      `;

      await execute(conn, query, [status, safeStringify(result), task_id]);

      // Fetch updated record to return
      const fetchQuery = `SELECT * FROM ${APP_SCHEMA}.TASK WHERE TASK_ID = ?`;
      const rows = await execute(conn, fetchQuery, [task_id]);
      const updatedTask = mapToLowerCase(rows)[0];

      if(updatedTask && updatedTask.result) {
        updatedTask.result = safeParse(updatedTask.result);
      }

      res.json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      console.error("Error in updateTask:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ----------------------------------------------------------------
  // Data Source / Tables
  // ----------------------------------------------------------------
  async getPusrDataTable(req, res) {
    const { user_id, persona_id } = req.query;

    if (!user_id || !persona_id) {
      return res.status(400).json({ success: false, error: "user_id and persona_id required" });
    }

    try {
      const conn = await connectSnowflake();

      // Note: Joining INFORMATION_SCHEMA in Snowflake
      // We map MSSQL [USR]... logic to APP_SCHEMA
      const query = `
        SELECT 
          ds.DATA_SOURCE_NAME AS "table_name",
          ds.DESCRIPTION AS "description",
          ds.SCHEMA_NAME AS "schema_name",
          c.SCHEMA_DESCRIPTION AS "schema_description"
        FROM ${APP_SCHEMA}.CLIENT c
        JOIN ${APP_SCHEMA}.USER_ACCESS ua ON c.CLIENT_ID = ua.CLIENT_ID
        JOIN ${APP_SCHEMA}.PERSONA p ON ua.PERSONA_ID = p.PERSONA_ID
        JOIN ${APP_SCHEMA}.DATA_SOURCE ds ON ds.DATA_SOURCE_ID = ua.DATA_SOURCE_ID
        JOIN ${INFO_SCHEMA}.TABLES t 
          ON UPPER(t.TABLE_NAME) = UPPER(ds.DATA_SOURCE_NAME) 
          AND UPPER(t.TABLE_SCHEMA) = UPPER(ds.SCHEMA_NAME)
        WHERE ua.USER_ID = ? 
        AND p.PERSONA_ID = ?
        AND ds.SCHEMA_NAME = c.SCHEMA_NAME
      `;

      const rows = await execute(conn, query, [user_id, persona_id]);
      // The query aliases ("table_name") will come back as UPPERCASE from Snowflake usually (TABLE_NAME)
      // mapToLowerCase handles this standardisation
      res.json({ success: true, data: mapToLowerCase(rows) });
    } catch (error) {
      console.error("Error in getPusrDataTable:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUsrDataTable(req, res) {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, error: "user_id required" });

    try {
      const conn = await connectSnowflake();

      const query = `
        SELECT 
          ds.DATA_SOURCE_NAME AS "table_name",
          ds.DESCRIPTION AS "description",
          ds.SCHEMA_NAME AS "schema_name",
          c.SCHEMA_DESCRIPTION AS "schema_description"
        FROM ${APP_SCHEMA}.CLIENT c
        JOIN ${APP_SCHEMA}.USER_ACCESS ua ON c.CLIENT_ID = ua.CLIENT_ID
        JOIN ${APP_SCHEMA}.DATA_SOURCE ds ON ds.DATA_SOURCE_ID = ua.DATA_SOURCE_ID
        JOIN ${INFO_SCHEMA}.TABLES t 
          ON UPPER(t.TABLE_NAME) = UPPER(ds.DATA_SOURCE_NAME) 
          AND UPPER(t.TABLE_SCHEMA) = UPPER(ds.SCHEMA_NAME)
        WHERE ua.USER_ID = ?
        AND ds.SCHEMA_NAME = c.SCHEMA_NAME
      `;

      const rows = await execute(conn, query, [user_id]);
      res.json({ success: true, data: mapToLowerCase(rows) });
    } catch (error) {
      console.error("Error in getUsrDataTable:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ----------------------------------------------------------------
  // Workflow Operations
  // ----------------------------------------------------------------
  async saveWorkflow(req, res) {
    const { workflow_id, workflow_name, metadata, workflow_steps } = req.body;

    if (!workflow_id || !workflow_steps) {
      return res.status(400).json({ success: false, error: "workflow_id and steps required" });
    }

    try {
      const conn = await connectSnowflake();
      const metadataStr = safeStringify(metadata);
      const workflowStepsStr = safeStringify(workflow_steps);
      const username = req.user?.username || "system";

      // Check existence
      const checkQuery = `SELECT 1 FROM ${APP_SCHEMA}.WORKFLOW WHERE WORKFLOW_ID = ?`;
      const exists = await execute(conn, checkQuery, [workflow_id]);

      if (exists.length > 0) {
        // UPDATE
        const updateQuery = `
          UPDATE ${APP_SCHEMA}.WORKFLOW 
          SET WORKFLOW_NAME = ?, 
              METADATA = ?, 
              WORKFLOW_STEPS = ?, 
              TIMESTAMP = CURRENT_TIMESTAMP() 
          WHERE WORKFLOW_ID = ?
        `;
        await execute(conn, updateQuery, [workflow_name, metadataStr, workflowStepsStr, workflow_id]);
        
        return res.json({
          success: true,
          message: "Workflow updated successfully",
          workflow_id,
        });
      } else {
        // INSERT
        const insertQuery = `
          INSERT INTO ${APP_SCHEMA}.WORKFLOW 
          (WORKFLOW_ID, WORKFLOW_NAME, CREATED_BY, METADATA, WORKFLOW_STEPS, TIMESTAMP) 
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
        `;
        await execute(conn, insertQuery, [workflow_id, workflow_name, username, metadataStr, workflowStepsStr]);

        return res.status(201).json({
          success: true,
          message: "Workflow created successfully",
          workflow_id,
        });
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      res.status(500).json({
        success: false,
        error: "Error saving workflow",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }

  async getWorkflowSteps(req, res) {
    const { workflow_id } = req.query;
    if (!workflow_id) return res.status(400).json({ success: false, error: "workflow_id required" });

    try {
      const conn = await connectSnowflake();
      
      const query = `
        SELECT 
          WORKFLOW_ID, 
          WORKFLOW_NAME, 
          METADATA, 
          WORKFLOW_STEPS, 
          CREATED_BY, 
          TIMESTAMP
        FROM ${APP_SCHEMA}.WORKFLOW
        WHERE WORKFLOW_ID = ?
        LIMIT 1
      `;

      const rows = await execute(conn, query, [workflow_id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: "Workflow not found" });
      }

      const workflow = mapToLowerCase(rows)[0];

      // Safe parse JSON fields
      workflow.metadata = safeParse(workflow.metadata);
      workflow.workflow_steps = safeParse(workflow.workflow_steps);
      
      // Map timestamp for compatibility
      workflow.created_at = workflow.timestamp;
      workflow.updated_at = workflow.timestamp;

      return res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      console.error("Error getting workflow steps:", error);
      res.status(500).json({
        success: false,
        error: "Error retrieving workflow steps",
        details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }
}

module.exports = new DataController();