const statusCodes = require("../utils/statusCodes");
const db = require("../config/database");

exports.getUserData = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    // Query using raw SQL since we're directly accessing the Users table
    const userData = await db.query(
      ` select distinct i.industry_id, i.industry_name,u.client_id, p.persona,p.persona_id,u.user_id,c.data_domain from [USR].[Persona] p 
      join [USR].[UserAccess] u on p.persona_id = u.persona_id 
      join [USR].[Users] us on us.user_id =u.user_id
      JOIN [USR].[Industry] i on u.industry_id = i.industry_id
      JOIN [USR].[Client] c on c.client_id=u.client_id
      WHERE us.email = :email`,
      {
        replacements: { email },
        type: db.QueryTypes.SELECT,
      }
    );

    if (!userData || userData.length === 0) {
      const error = new Error("User not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }

    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "User data fetched successfully",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getLoggedInUserInfo = async (req, res, next) => {
  try {
    // Check if req.user exists AFTER the middleware has run
    if (!req.user) {
      const error = new Error("User not found or unauthorized");
      error.statusCode = statusCodes.UNAUTHORIZED;
      throw error;
    }
    const userData = {
      username: req.user.name,
      userId: req.user.userId,
      email: req.user.email,
      image_url: req.user.image_url,
      // ... other user information
    };
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "User info fetched successfully",
      data: userData,
    });
  } catch (error) {
    // Instead of logging here, just pass the error to the centralized error handler
    next(error);
  }
};
