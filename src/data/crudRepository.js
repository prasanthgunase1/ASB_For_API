const { mapping } = require("../db/modelMapping");
const statusCodes = require("../utils/statusCodes");
const { logger } = require("../utils/logger");

exports.findAll = async (modelName, options = {}) => {
  const model = mapping[modelName];
  if (!model)
    throw Object.assign(new Error(`Model ${modelName} not found`), {
      statusCode: statusCodes.NOT_FOUND,
    });

  // Create a new options object without the where property
  const { where: optionsWhere, ...restOptions } = options;

  // Merge the where conditions from options with your new where conditions
  const where = {
    ...(optionsWhere || {}),
    ...options.where,
  };

  // Add user filtering
  if (options.context?.user && model.rawAttributes.created_by) {
    where.created_by = options.context.user.username;
  }

  const queryOptions = {
    ...restOptions,
    where,
    order: [["updated_at", "DESC"]], // Order by updated_at for latest activity
  };

  // For conversation model, include latest USER message for chat titles
  if (modelName === "conversation") {
    queryOptions.include = [
      {
        model: mapping["message"],
        as: "messages",
        where: {
          sender_type: "user", // Only include user messages, not AI responses
        },
        limit: 1,
        order: [["created_at", "DESC"]], // Get the most recent user message
        attributes: [
          "id",
          "message",
          "message_type",
          "sender_type",
          "created_at",
        ],
        required: false, // Use LEFT JOIN to include conversations without user messages
      },
    ];
  }

  return await model.findAndCountAll(queryOptions);
};

exports.findById = async (modelName, id, options = {}) => {
  const model = mapping[modelName];
  if (!model)
    throw Object.assign(new Error(`Model ${modelName} not found`), {
      statusCode: statusCodes.NOT_FOUND,
    });

  const where = modelName === "task" ? { task_id: id } : { id };
  if (
    model.rawAttributes.created_by &&
    !options.context?.systemUpdate &&
    options.context?.user?.username
  ) {
    where.created_by = options.context.user.username;
  }

  const findOpts = { where };
  if (modelName === "conversation") {
    findOpts.include = [
      {
        model: mapping["message"],
        as: "messages",
        include: [{ model: mapping["file"], as: "files" }],
      },
    ];
  }

  const record = await model.findOne(findOpts);

  // With quiet option, just return null instead of throwing error
  if (!record && !options.quiet)
    throw Object.assign(new Error("Record not found or user unauthorized"), {
      statusCode: statusCodes.NOT_FOUND,
    });

  return record;
};

exports.create = async (modelName, data, options = {}) => {
  const model = mapping[modelName];
  if (!model)
    throw Object.assign(new Error(`Model ${modelName} not found`), {
      statusCode: statusCodes.NOT_FOUND,
    });
  if (!data)
    throw Object.assign(new Error("Invalid input data"), {
      statusCode: statusCodes.BAD_REQUEST,
    });
  return await model.create(data, options);
};

exports.update = async (modelName, id, data, options = {}) => {
  const model = mapping[modelName];
  if (!model)
    throw Object.assign(new Error(`Model ${modelName} not found`), {
      statusCode: statusCodes.NOT_FOUND,
    });
  if (!data)
    throw Object.assign(new Error("Invalid input data"), {
      statusCode: statusCodes.BAD_REQUEST,
    });

  if (options.context?.user && model.rawAttributes.updated_by) {
    data.updated_by = options.context.user.username;
  }

  // use `task_id` for Task PK
  const where = modelName === "task" ? { task_id: id } : { id };

  const [count, rows] = await model.update(data, {
    where,
    returning: true,
    ...options,
  });
  if (count === 0) {
    const exists = await model.findOne({ where });
    if (!exists)
      throw Object.assign(new Error("Record not found"), {
        statusCode: statusCodes.NOT_FOUND,
      });
    return exists;
  }
  return rows[0];
};

exports.deleteRecord = async (modelName, id, options = {}) => {
  const model = mapping[modelName];
  if (!model)
    throw Object.assign(new Error(`Model ${modelName} not found`), {
      statusCode: statusCodes.NOT_FOUND,
    });

  const where = { id };
  if (options.context?.user?.username && model.rawAttributes.created_by) {
    where.created_by = options.context.user.username;
  }

  const count = await model.destroy({ where, ...options });
  if (count === 0)
    throw Object.assign(new Error("Record not found or user unauthorized"), {
      statusCode: statusCodes.NOT_FOUND,
    });
  return count;
};
