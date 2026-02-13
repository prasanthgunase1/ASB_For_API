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

  // Create conversation validation rules
  create: {
    conversation_id: {
      in: ["body"],
      notEmpty: {
        errorMessage: "conversation_id can not be empty",
      },
      // Change: Validate as numeric string
      isNumeric: {
        errorMessage: "conversation_id must be a numeric value",
      },
      // REMOVED: toInt: true
    },
    message: {
      in: ["body"],
      notEmpty: {
        errorMessage: "message cannot be empty",
      },
    },
    sender_type: {
      in: ["body"],
      notEmpty: {
        errorMessage: "sender_type cannot be empty",
      },
      equals: {
        options: "user",
        errorMessage: "sender_type must be 'user' for user messages",
      },
    },
    message_type: {
      in: ["body"],
      notEmpty: {
        errorMessage: "message_type cannot be empty",
      },
      isIn: {
        options: [["text", "image", "video", "file", "sticker", "gif"]],
        errorMessage:
          "message_type must be one of: 'text', 'image', 'video', 'file', 'sticker', 'gif'",
      },
    },
    feedback_reaction: {
      in: ["body"],
      optional: true,
      isIn: {
        options: [["like", "dislike"]],
        errorMessage: "feedback_reaction must be either 'like' or 'dislike'",
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
    message: {
      in: ["body"],
      optional: true,
      notEmpty: {
        errorMessage: "message cannot be empty",
      },
    },
    sender_type: {
      in: ["body"],
      optional: true,
      notEmpty: {
        errorMessage: "sender_type cannot be empty",
      },
      isIn: {
        options: [["user", "chatai"]],
        errorMessage: "sender_type must be either 'user' or 'chatai'",
      },
    },
    feedback_reaction: {
      in: ["body"],
      optional: true,
      isIn: {
        options: [["like", "dislike"]],
        errorMessage: "feedback_reaction must be either 'like' or 'dislike'",
      },
    },
    message_type: {
      in: ["body"],
      optional: true,
      notEmpty: {
        errorMessage: "message_type cannot be empty",
      },
      isIn: {
        options: [["text", "image", "video", "file", "sticker", "gif"]],
        errorMessage:
          "message_type must be one of: 'text', 'image', 'video', 'file', 'sticker', 'gif'",
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