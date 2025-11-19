const paginationRules = {
  page: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "page must be a positive integer",
    },
    toInt: true, // Sanitize to integer
  },
  limit: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: "limit must be a positive integer between 1 and 100",
    },
    toInt: true, // Sanitize to integer
  },
};

module.exports = {
  //GET by id validation rule
  get_id: {
    id: {
      in: ["params"],
      optional: true,
      isInt: {
        errorMessage: "ID must be an integer",
      },
      toInt: true,
    },
  },

  //Get all data validation rules
  get_all: {
    ...paginationRules, // Include pagination rules
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
      isInt: {
        errorMessage: "id must be an integer",
      },
      toInt: true, // Sanitize to integer
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
      isInt: {
        errorMessage: "ID must be an integer",
      },
      toInt: true,
    },
  },
};
