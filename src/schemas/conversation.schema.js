const paginationRules = {
  page: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "page must be a positive integer",
    },
    toInt: true, // Pagination page numbers are small, so toInt is safe here
  },
  limit: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: "limit must be a positive integer between 1 and 100",
    },
    toInt: true, // Limit is small (max 100), so toInt is safe here
  },
};

module.exports = {
  // GET by id validation rule
  get_id: {
    id: {
      in: ["params"],
      optional: true,
      // Change: Ensure it is a valid number string, but DO NOT convert to JS Number
      isNumeric: {
        errorMessage: "ID must be a numeric value",
      },
      // REMOVED: toInt: true (Prevents BigInt corruption)
    },
  },

  // Get all data validation rules
  get_all: {
    ...paginationRules,
  },

  // Create conversation validation rules
  create: {
    user_id: {
      in: ["body"],
      notEmpty: {
        errorMessage: "user_id is required",
      },
      isString: {
        errorMessage: "user_id must be a string",
      },
    },
    title: {
      in: ["body"],
      optional: true,
      isString: {
        errorMessage: "title must be a string",
      },
    },
    conversation_metadata: {
      in: ["body"],
      optional: true,
      custom: {
        options: (value) => {
          if (typeof value !== "object" || Array.isArray(value)) {
            throw new Error("conversation_metadata must be a JSON object");
          }
          return true;
        },
      },
    },
  },

  // Update conversation validation rules
  update: {
    id: {
      in: ["params"],
      // Change: Validate as numeric string to handle Snowflake BigInts
      isNumeric: {
        errorMessage: "id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
    user_id: {
      in: ["body"],
      optional: true,
      isString: {
        errorMessage: "user_id must be a string",
      },
    },
    title: {
      in: ["body"],
      optional: true,
      isString: {
        errorMessage: "title must be a string",
      },
    },
    conversation_metadata: {
      in: ["body"],
      optional: true,
      custom: {
        options: (value) => {
          if (typeof value !== "object" || Array.isArray(value)) {
            throw new Error("conversation_metadata must be a JSON object");
          }
          return true;
        },
      },
    },
  },

  // Delete conversation validation rules
  delete: {
    id: {
      in: ["params"],
      // Change: Validate as numeric string
      isNumeric: {
        errorMessage: "ID must be a numeric value",
      },
      // REMOVED: toInt: true
    },
  },
};