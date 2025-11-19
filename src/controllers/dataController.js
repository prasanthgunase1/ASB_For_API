const {
  Persona,
  Task,
  Client,
  UserAccess,
  DataSource,
  Workflow,
} = require("../db/models");
const sequelize = require("../config/database");

class DataController {
  async updateKpis(req, res) {
    const { kpi, persona_id, persona } = req.body;

    if (!kpi || !persona_id || !persona) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: kpi, persona_id, persona",
      });
    }

    try {
      const kpiString = typeof kpi === "object" ? JSON.stringify(kpi) : kpi;

      await Persona.update(
        {
          KPIs: kpiString,
          updated_at: sequelize.literal("GETDATE()"),
        },
        {
          where: {
            persona_id: parseInt(persona_id, 10),
            persona: persona.toString(),
          },
        }
      );

      res.json({
        success: true,
        message: "KPIs updated successfully",
      });
    } catch (error) {
      console.error("Error in updateKpis:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getPersona(req, res) {
    const { persona_id } = req.query;

    if (!persona_id) {
      return res.status(400).json({
        success: false,
        error: "persona_id is required",
      });
    }

    try {
      const result = await Persona.findOne({
        where: { persona_id },
        attributes: ["KPIs"],
      });

      res.json({
        success: true,
        data: result ? result.KPIs : {},
      });
    } catch (error) {
      console.error("Error in getPersona:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getTask(req, res) {
    const { task_id } = req.query;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        error: "task_id is required",
      });
    }

    try {
      const result = await Task.findOne({
        where: { task_id },
        attributes: ["task_id", "status", "result"],
      });

      res.json({
        success: true,
        data: result || {},
      });
    } catch (error) {
      console.error("Error in getTask:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createTask(req, res) {
    const { task_id, user_id, chat_id, status } = req.body;

    if (!task_id || !user_id || !chat_id || !status) {
      return res.status(400).json({
        success: false,
        error: "task_id, user_id, chat_id, and status are required",
      });
    }

    try {
      const task = await Task.create({
        task_id,
        user_id,
        chat_id,
        status,
      });

      res.json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      console.error("Error in createTask:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateTask(req, res) {
    const { task_id, status, result } = req.body;

    if (!task_id || !status) {
      return res.status(400).json({
        success: false,
        error: "task_id and status are required",
      });
    }

    try {
      const updatedTask = await Task.update(
        {
          status,
          result,
        },
        {
          where: { task_id },
          returning: true,
        }
      );

      res.json({
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      console.error("Error in updateTask:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getPusrDataTable(req, res) {
    const { user_id, persona_id } = req.query;

    if (!user_id || !persona_id) {
      return res.status(400).json({
        success: false,
        error: "user_id and persona_id are required",
      });
    }

    try {
      const result = await sequelize.query(
        `SELECT 
          ds.data_source_name AS table_name,
          ds.description,
          ds.schema_name,
          c.schema_description
        FROM USR.Client c
        JOIN USR.UserAccess ua ON c.client_id = ua.client_id
        JOIN USR.Persona p ON ua.persona_id = p.persona_id
        JOIN USR.DataSource ds ON ds.data_source_id = ua.data_source_id
        JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_NAME = ds.data_source_name 
          AND t.TABLE_SCHEMA = ds.schema_name
        WHERE ua.user_id = :user_id 
        AND p.persona_id = :persona_id
        AND ds.schema_name = c.schema_name`,
        {
          replacements: { user_id, persona_id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error in getPusrDataTable:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getUsrDataTable(req, res) {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "user_id is required",
      });
    }

    try {
      const result = await sequelize.query(
        `SELECT 
          ds.data_source_name AS table_name,
          ds.description,
          ds.schema_name,
          c.schema_description
        FROM USR.Client c
        JOIN USR.UserAccess ua ON c.client_id = ua.client_id
        JOIN USR.DataSource ds ON ds.data_source_id = ua.data_source_id
        JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_NAME = ds.data_source_name 
          AND t.TABLE_SCHEMA = ds.schema_name
        WHERE ua.user_id = :user_id
        AND ds.schema_name = c.schema_name`,
        {
          replacements: { user_id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error in getUsrDataTable:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Save a workflow with its steps
   * @route POST /save-workflow
   */
  async saveWorkflow(req, res) {
    try {
      const { workflow_id, workflow_name, metadata, workflow_steps } = req.body;

      if (!workflow_id || !workflow_steps) {
        return res.status(400).json({
          success: false,
          error: "workflow_id and workflow_steps are required",
        });
      }

      // Sanitize and prepare data
      const metadataStr = metadata ? JSON.stringify(metadata) : null;
      const workflowStepsStr = Array.isArray(workflow_steps)
        ? JSON.stringify(workflow_steps)
        : workflow_steps;
      const username = req.user?.username || "system";

      // Check if the workflow exists
      const existingWorkflow = await Workflow.findOne({
        where: { workflow_id },
      });

      if (existingWorkflow) {
        // Use raw query to bypass Sequelize date handling for Azure SQL Server
        await sequelize.query(
          `UPDATE [USR].[workflows] 
         SET [workflow_name] = :workflow_name, 
             [metadata] = :metadata, 
             [workflow_steps] = :workflow_steps, 
             [timestamp] = GETDATE() 
         WHERE [workflow_id] = :workflow_id`,
          {
            replacements: {
              workflow_id,
              workflow_name,
              metadata: metadataStr,
              workflow_steps: workflowStepsStr,
            },
            type: sequelize.QueryTypes.UPDATE,
          }
        );

        return res.json({
          success: true,
          message: "Workflow updated successfully",
          workflow_id,
        });
      } else {
        // Use raw query for insert as well
        await sequelize.query(
          `INSERT INTO [USR].[workflows] 
         ([workflow_id], [workflow_name], [created_by], [metadata], [workflow_steps], [timestamp]) 
         VALUES (:workflow_id, :workflow_name, :created_by, :metadata, :workflow_steps, GETDATE())`,
          {
            replacements: {
              workflow_id,
              workflow_name,
              created_by: username,
              metadata: metadataStr,
              workflow_steps: workflowStepsStr,
            },
            type: sequelize.QueryTypes.INSERT,
          }
        );

        return res.status(201).json({
          success: true,
          message: "Workflow created successfully",
          workflow_id,
        });
      }
    } catch (error) {
      console.error("Error saving workflow:", error);

      // Specific error handling for Azure SQL Server errors
      if (error.parent) {
        // Date conversion error (SQL Server error 241)
        if (error.parent.number === 241) {
          return res.status(500).json({
            success: false,
            error: "Date format error in workflow data",
            details:
              process.env.NODE_ENV !== "production"
                ? "SQL Server cannot process the date format. Using direct SQL queries instead."
                : undefined,
          });
        }

        // JSON parsing error (common with large JSON payloads in SQL Server)
        if (error.parent.number === 8152) {
          return res.status(500).json({
            success: false,
            error: "Workflow data exceeds maximum allowed size",
            details:
              process.env.NODE_ENV !== "production"
                ? "Consider breaking down large workflows into smaller components."
                : undefined,
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: "Error saving workflow. Please try again.",
        details:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }

  /**
   * Get workflow steps by workflow ID
   * @route GET /api/data/get-workflow-steps?workflow_id=<workflow_id_value>
   */
  async getWorkflowSteps(req, res) {
    try {
      const { workflow_id } = req.query;

      if (!workflow_id) {
        return res.status(400).json({
          success: false,
          error: "workflow_id is required as a query parameter",
        });
      }

      // Use raw query first to check if workflow exists and diagnose any issues
      const rawWorkflow = await sequelize.query(
        `SELECT TOP 1 workflow_id, workflow_name FROM USR.workflows WHERE workflow_id = :workflow_id`,
        {
          replacements: { workflow_id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!rawWorkflow || rawWorkflow.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      // If raw query succeeded, try to get the full model - only requesting columns that exist
      const workflow = await Workflow.findOne({
        where: { workflow_id },
        attributes: [
          "workflow_id",
          "workflow_name",
          "metadata",
          "workflow_steps",
          "created_by",
          "timestamp",
        ],
      });

      return res.json({
        success: true,
        data: {
          workflow_id: workflow.workflow_id,
          workflow_name: workflow.workflow_name,
          created_by: workflow.created_by,
          timestamp: workflow.timestamp,
          metadata: workflow.metadata,
          workflow_steps: workflow.workflow_steps,
          // Map timestamp to created_at/updated_at for API backwards compatibility
          created_at: workflow.timestamp,
          updated_at: workflow.timestamp,
        },
      });
    } catch (error) {
      console.error("Error getting workflow steps:", error);

      // Enhanced error logging for Azure diagnostics
      if (error.parent && error.parent.errors) {
        error.parent.errors.forEach((err) => {
          console.error("SQL Error Detail:", err.message);
        });
      }

      // Check for specific SQL Server errors
      let errorMessage = "Error retrieving workflow steps";
      if (error.parent && error.parent.number) {
        switch (error.parent.number) {
          case 208: // Invalid object name
            errorMessage = "The workflows table does not exist";
            break;
          case 207: // Invalid column name
            errorMessage =
              "One or more columns in the workflows table are missing";
            break;
          case 4060: // Database access denied
          case 4064:
            errorMessage = "Database access permission denied";
            break;
          case 18456: // Login failed
            errorMessage = "Database authentication failed";
            break;
        }
      }

      return res.status(500).json({
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }
}

module.exports = new DataController();
