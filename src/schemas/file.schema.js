const paginationRules = {
  page: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "page must be a positive integer",
    },
    toInt: true, // Safe for page numbers
  },
  limit: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: "limit must be a positive integer between 1 and 100",
    },
    toInt: true, // Safe for limit
  },
};

module.exports = {
  // GET by id validation rule
  get_id: {
    id: {
      in: ["params"],
      optional: true,
      // Change: Validate as numeric string (BigInt safe)
      isNumeric: {
        errorMessage: "id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
  },

  // Get all data validation rules
  get_all: {
    ...paginationRules,
  },

  // Create file validation rules
  create: {
    message_id: {
      in: ["body"],
      notEmpty: {
        errorMessage: "message_id is required",
      },
      // Change: Validate as numeric string (BigInt safe)
      isNumeric: {
        errorMessage: "message_id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
    user_id: {
      in: ["body"],
      notEmpty: {
        errorMessage: "user_id is required",
      },
      isString: {
        errorMessage: "user_id must be a string",
      },
    },
    file_name: {
      in: ["body"],
      optional: true,
      isString: {
        errorMessage: "file_name must be a string",
      },
    },
    file_url: {
      in: ["body"],
      notEmpty: {
        errorMessage: "file_url is required",
      },
      isString: {
        errorMessage: "file_url must be a string",
      },
    },
    file_size: {
      in: ["body"],
      notEmpty: {
        errorMessage: "file_size is required",
      },
      isInt: {
        errorMessage: "file_size must be an integer",
      },
      toInt: true, // Safe: File sizes fit in JS Numbers (up to 9 Petabytes)
    },
    file_type: {
      in: ["body"],
      notEmpty: {
        errorMessage: "file_type is required",
      },
      isIn: {
        options: [["image", "document"]],
        errorMessage: "file_type must be either 'image' or 'document'",
      },
    },
  },

  // Update conversation validation rules
  update: {
    id: {
      in: ["params"],
      // Change: Validate as numeric string
      isNumeric: {
        errorMessage: "id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
    user_id: {
      in: ["body"],
      optional: true,
      notEmpty: {
        errorMessage: "user_id is required",
      },
      isString: {
        errorMessage: "user_id must be a string",
      },
    },
    message_id: {
      in: ["body"],
      optional: true,
      // Change: Validate as numeric string
      isNumeric: {
        errorMessage: "message_id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
    file_size: {
      in: ["body"],
      optional: true,
      isInt: {
        errorMessage: "file_size must be an integer",
      },
      toInt: true, // Safe
    },
    file_url: {
      in: ["body"],
      optional: true,
      isString: {
        errorMessage: "file_url must be a string",
      },
    },
    file_type: {
      in: ["body"],
      optional: true,
      isIn: {
        options: [["image", "document"]],
        errorMessage: "file_type must be either 'image' or 'document'",
      },
    },
    file_name: {
      in: ["body"],
      optional: true,
      isString: {
        errorMessage: "file_name must be a string",
      },
    },
  },

  // Delete conversation validation rules
  delete: {
    id: {
      in: ["params"],
      // Change: Validate as numeric string
      isNumeric: {
        errorMessage: "id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
  },
};