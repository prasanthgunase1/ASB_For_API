const { connectSnowflake } = require("../config/database");
const { mapping } = require("../db/modelMapping");
const statusCodes = require("../utils/statusCodes");

// --- HELPER: Execute Snowflake Query Promisified ---
const execute = (sqlText, binds = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const conn = await connectSnowflake();
      conn.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("❌ Repo Error:", err.message, "\nSQL:", sqlText);
            return reject(err);
          }
          resolve(rows);
        },
      });
    } catch (e) {
      reject(e);
    }
  });
};

// --- HELPER: Map Uppercase Keys to Lowercase ---
const mapKeys = (rows) => {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key.toLowerCase()] = row[key];
    }
    return newRow;
  });
};

// --- HELPER: Case-Insensitive Table Lookup ---
const getTableName = (modelName) => { 
  // 1. Try exact match
  if (mapping[modelName]) return mapping[modelName];

  // 2. Try case-insensitive match
  const key = Object.keys(mapping).find(
    (k) => k.toLowerCase() === modelName.toLowerCase()
  );
  
  if (key) return mapping[key];

  console.error(`❌ Model mapping not found for: '${modelName}'. Available keys:`, Object.keys(mapping));
  return null;
}; 

exports.findAll = async (modelName, options = {}) => {
  const tableName = getTableName(modelName); 
  if (!tableName) {
    const err = new Error(`Model ${modelName} not found`);
    err.statusCode = statusCodes.NOT_FOUND;
    throw err;
  }

  const { page, limit, where: whereOpts, context } = options;
  const binds = [];
  let whereClauses = [];

  // 1. Build Base Where Clauses
  if (whereOpts) {
    Object.keys(whereOpts).forEach((key) => {
      whereClauses.push(`${key.toUpperCase()} = ?`);
      binds.push(whereOpts[key]);
    });
  }

  // 2. Handle User Context Filtering
  if (context?.user?.username) {
    whereClauses.push("CREATED_BY = ?");
    binds.push(context.user.username);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // 3. Special Handling: Conversations
  if (modelName === "conversation") {
    const messageTable = getTableName("message") || mapping["message"] || "MESSAGES"; 

    const sql = `
      SELECT 
        c.*,
        m.ID as MSG_ID,
        m.MESSAGE as MSG_CONTENT,
        m.MESSAGE_TYPE as MSG_TYPE,
        m.SENDER_TYPE as MSG_SENDER,
        m.CREATED_AT as MSG_CREATED_AT
      FROM ${tableName} c
      LEFT JOIN (
          SELECT ID, CONVERSATION_ID, MESSAGE, MESSAGE_TYPE, SENDER_TYPE, CREATED_AT
          FROM ${messageTable}
          WHERE SENDER_TYPE = 'user'
          QUALIFY ROW_NUMBER() OVER (PARTITION BY CONVERSATION_ID ORDER BY CREATED_AT DESC) = 1
      ) m ON c.ID = m.CONVERSATION_ID
      ${whereSql}
      ORDER BY c.UPDATED_AT DESC
      LIMIT ? OFFSET ?
    `;

    const offset = ((page || 1) - 1) * (limit || 10);
    const finalBinds = [...binds, limit || 10, offset];

    const rows = await execute(sql, finalBinds);
    
    const mappedRows = mapKeys(rows).map(row => {
      const { msg_id, msg_content, msg_type, msg_sender, msg_created_at, ...conversation } = row;
      if (msg_id) {
        conversation.messages = [{
          id: msg_id,
          message: msg_content,
          message_type: msg_type,
          sender_type: msg_sender,
          created_at: msg_created_at
        }];
      } else {
        conversation.messages = [];
      }
      return conversation;
    });

    return mappedRows;
  }

  // 4. Standard findAll
  const offset = ((page || 1) - 1) * (limit || 10);
  const sql = `
    SELECT * FROM ${tableName}
    ${whereSql}
    ORDER BY UPDATED_AT DESC
    LIMIT ? OFFSET ?
  `;
  
  const finalBinds = [...binds, limit || 10, offset];
  const rows = await execute(sql, finalBinds);
  return mapKeys(rows);
};

exports.findById = async (modelName, id, options = {}) => {
  const tableName = getTableName(modelName); 
  if (!tableName) throw { statusCode: statusCodes.NOT_FOUND, message: `Model ${modelName} not found` };

  const binds = [];
  const whereClauses = [];

  const pkColumn = modelName === "task" ? "TASK_ID" : "ID";
  whereClauses.push(`${pkColumn} = ?`);
  binds.push(id);

  if (options.context?.user?.username && !options.context?.systemUpdate) {
    whereClauses.push("CREATED_BY = ?");
    binds.push(options.context.user.username);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
  const sql = `SELECT * FROM ${tableName} ${whereSql} LIMIT 1`;

  const rows = await execute(sql, binds);
  let record = mapKeys(rows)[0];

  if (!record) {
    if (options.quiet) return null;
    throw { statusCode: statusCodes.NOT_FOUND, message: "Record not found or user unauthorized" };
  }

  if (modelName === "conversation") {
    const msgTable = getTableName("message"); 
    if (msgTable) {
        const msgSql = `
        SELECT m.* FROM ${msgTable} m
        WHERE m.CONVERSATION_ID = ?
        ORDER BY m.CREATED_AT ASC
        `;
        const messages = await execute(msgSql, [record.id]);
        record.messages = mapKeys(messages).map(m => ({ ...m, files: [] }));
    }
  }

  return record;
};

// --- CORRECTED CREATE FUNCTION ---
// --- CRITICAL FIX: Snowflake-Compatible Create Function ---
exports.create = async (modelName, data, options = {}) => {
  const tableName = getTableName(modelName); 
  
  if (!tableName) {
      console.error(`[Repository] Create failed. Model '${modelName}' could not be mapped to a table.`);
      throw { statusCode: statusCodes.NOT_FOUND, message: "Model not found" };
  }
  if (!data) throw { statusCode: statusCodes.BAD_REQUEST, message: "Invalid data" };

  // 1. Auth Bypass / Default User
  if (!data.created_by && !data.CREATED_BY) {
      data.created_by = options.context?.user?.username || "developer@example.com";
  }

  // 2. FETCH ID MANUALLY (Fixes 'unexpected RETURNING' error)
  // We query the sequence first so we know the ID before inserting.
  if (!data.id && !data.ID) {
      const seqName = `${tableName}_ID_SEQ`;
      try {
          // Get the next value from the sequence
          const seqRows = await execute(`SELECT ${seqName}.NEXTVAL`);
          
          if (seqRows && seqRows.length > 0) {
             // Snowflake returns keys in uppercase (e.g. "NEXTVAL"). 
             // Object.values() gets the number (e.g. 105) regardless of the key name.
             data.id = Object.values(seqRows[0])[0];
          } else {
             throw new Error(`Failed to fetch sequence: ${seqName}`);
          }
      } catch (err) {
          console.error("❌ Sequence Error:", err.message);
          throw err; 
      }
  }

  // 3. Prepare Insert Data
  const cols = [];
  const valuePlaceholders = []; 
  const binds = [];
  
  Object.keys(data).forEach(key => {
    cols.push(key.toUpperCase());
    valuePlaceholders.push("?"); 
    
    // Stringify objects/arrays for Snowflake variants
    let val = data[key];
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      val = JSON.stringify(val);
    }
    binds.push(val);
  });

  // 4. Standard Insert (No RETURNING clause)
  const sql = `
    INSERT INTO ${tableName} (${cols.join(", ")})
    VALUES (${valuePlaceholders.join(", ")}) 
  `;

  await execute(sql, binds);

  // 5. Return data (ID is now included!)
  return data;
};

exports.update = async (modelName, id, data, options = {}) => {
  const tableName = getTableName(modelName); 
  if (!tableName) throw { statusCode: statusCodes.NOT_FOUND, message: "Model not found" };

  const updateData = { ...data };
  if (options.context?.user?.username) {
    updateData.updated_by = options.context.user.username;
    updateData.updated_at = new Date(); 
  }

  const cols = [];
  const binds = [];
  
  Object.keys(updateData).forEach(key => {
    cols.push(`${key.toUpperCase()} = ?`);
    
    // Variant Fix: Stringify Objects
    let val = updateData[key];
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      val = JSON.stringify(val);
    }
    
    binds.push(val);
  });

  const pkColumn = modelName === "task" ? "TASK_ID" : "ID";
  binds.push(id);

  const sql = `UPDATE ${tableName} SET ${cols.join(", ")} WHERE ${pkColumn} = ?`;

  await execute(sql, binds);

  const fetchSql = `SELECT * FROM ${tableName} WHERE ${pkColumn} = ?`;
  const rows = await execute(fetchSql, [id]);
  const updated = mapKeys(rows)[0];

  if (!updated) throw { statusCode: statusCodes.NOT_FOUND, message: "Record not found" };
  
  return updated;
};

exports.deleteRecord = async (modelName, id, options = {}) => {
  const tableName = getTableName(modelName); 
  if (!tableName) throw { statusCode: statusCodes.NOT_FOUND, message: "Model not found" };

  const whereClauses = ["ID = ?"];
  const binds = [id];

  if (options.context?.user?.username) {
    whereClauses.push("CREATED_BY = ?");
    binds.push(options.context.user.username);
  }

  const sql = `DELETE FROM ${tableName} WHERE ${whereClauses.join(" AND ")}`;
  
  await execute(sql, binds);

  return { success: true, id };
};