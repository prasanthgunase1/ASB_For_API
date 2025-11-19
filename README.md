# deepthought-express-keycloak-api

This guide details the Express.js Keycloak authentication template, designed for building production-ready backend applications with Node.js.

## Introduction

This template streamlines the development of secure, scalable backend applications using Node.js and Express.js. It manages authentication and authorization via Keycloak, providing a strong foundation for your project.

## Key Features

- **Token Management**: Secure access and refresh token handling.
- **User Data Retrieval**: `/users/me` API for current user information.
- **Dynamic CRUD Operations**: Sequelize-based, model selection through URL paths.
- **Structured Architecture**: Separation of Controller, Service, and Data layers.
- **Docker Deployment**: Production-ready Dockerfile.
- **Utility Functions**: Authentication and user information helpers.
- **Detailed Logging**: Winston for structured logging.
- **Environment Configuration**: `.env` file for environment variables.
- **Enhanced Security**: Helmet for security headers.
- **Request Logging**: Middleware for request/response logging.
- **WebSocket Integration**: Seamless WebSocket support added for real-time messaging.
- **Validation library Integration**:Schema-based input validation Implemented using express-validator. 

## Tech Stack

- Node.js with Express.js
- Keycloak
- Sequelize ORM
- Docker
- Winston
- Helmet

## Folder Structure
```my-app/
├── .env                       # Environment variables configuration
├── .env.example               # Example environment variables file
├── .gitignore                 # Specifies intentionally untracked files that Git should ignore
├── .sequelizerc               # Sequelize CLI configuration
├── docker-compose.worker.example # Example Docker Compose file for the worker service
├── Dockerfile                 # Dockerfile for the main application
├── Dockerfile.worker          # Dockerfile for the agent worker service
├── package-lock.json          # Records the exact versions of dependencies
├── package.json               # Project dependencies and scripts
├── README.md                  # This file
└── .vscode                    # VS Code specific settings
    └── settings.json          # Project-specific VS Code settings
└── src
    ├── app.js                   # Main application entry point
    ├── config                   # Application configuration files
    │   ├── config.js              # General application configuration
    │   ├── database.js            # Database connection configuration (Sequelize)
    │   ├── helmetConfig.js        # Security headers configuration
    │   ├── keycloak.js            # Keycloak authentication configuration
    │   └── redisClient.js         # Redis client setup
    ├── controllers              # Handles incoming requests and orchestrates logic
    │   ├── agentController.js     # Controller for agent-related actions
    │   ├── chatAiController.js    # Controller for chat AI functionality
    │   ├── crudController.js      # Generic CRUD operations controller
    │   ├── mediaController.js     # Controller for handling media files
    │   └── userController.js      # Controller for user-related actions
    ├── data                     # Data access layer
    │   └── crudRepository.js      # Generic data repository
    ├── db                       # Database related files
    │   ├── modelMapping.js        # Maps database models
    │   ├── migrations             # Sequelize database migrations
    │   │   ├── 20250228085154-create-conversation.js
    │   │   ├── 20250228090924-create-message.js
    │   │   ├── 20250228091738-create-file.js
    │   │   ├── ... (other migration files) ...
    │   │   └── 20250325055038-update-foreign-keys.js
    │   ├── models                 # Sequelize database models
    │   │   ├── conversation.js
    │   │   ├── file.js
    │   │   ├── index.js           # Sequelize model index
    │   │   └── message.js
    ├── seeders                  # Sequelize database seeders (if any)
    ├── middlewares
    │   ├── authMiddleware.js
    │   ├── crudMiddleware.js
    │   ├── uploadMiddleware.js
    │   └── validateInputMiddleware.js
    ├── routes                   # API endpoint definitions
    │   ├── agentRoute.js        # Routes for agent-related endpoints
    │   ├── crudRoute.js         # Routes for generic CRUD endpoints
    │   ├── mediaRoute.js        # Routes for media-related endpoints
    │   └── userRoute.js         # Routes for user-related endpoints
    ├── schemas                        
    │   ├── index.js             #Will load schema files
    │   ├── conversation.schema.js    
    │   ├── file.schema.js            
    │   ├── message.schema.js                   
    ├── services                 # Business logic and service integrations
    │   ├── agentService.js      # Service for interacting with the agent
    │   ├── chatAiService.js     # Service for chat AI functionality
    │   ├── crudService.js       # Service for generic CRUD operations
    │   ├── mediaService.js      # Service for media handling
    │   ├── queueService.js      # Service for managing message queues (BullMQ)
    │   └── socketService.js     # Service for WebSocket functionality
    └── utils                    # Utility functions and helpers
        ├── agentWorker.js       # Background worker for agent tasks (BullMQ)
        ├── azureBlob.js         # Utility for Azure Blob storage (if used)
        ├── errorHandler.js      # Centralized error handling
        ├── jobCompletionHandler.js # Handles completion of background jobs
        ├── logger.js            # Logging utility (Winston)
        ├── statusCodes.js       # Defines HTTP status codes
        └── uploadFileHelper.js  # Utility for file uploads
```
### Versions:
- **v1.0.0**: For detailed documentation, open this doc: [v1.0.0-Template Guide](https://drive.google.com/file/d/1Mm4y1D8t4QeBlbJqWzUAP8U-YTk6JC2t/view?usp=drive_link)
- **v1.1.0**: For detailed documentation, open this doc: [v1.1.0-Template Guide](https://drive.google.com/file/d/1r9BMj6FxqEvWKK8Pw7XROdlFOnZ2bCm0/view?usp=drive_link)

## Setup Instructions

### Setting up a project from the template:

#### Step 1: Clone the template.
```sh
 git clone --branch v1.0.0 <template-repo-url> my-app
 cd my-app
 git remote rename origin template
 git remote add origin <your-app-repo-url>
 git checkout -b branch-name  # (Only if you don’t have a branch)
 git push -u origin branch-name
```
> **Note**: Ensure not to push anything to the template repo itself.

#### Step 2: Install Dependencies
```sh
npm install
```

#### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and populate it with required values.
> **Important**: Do not commit `.env` to version control.

#### Step 4: Run Migrations
```sh
npx sequelize-cli db:migrate
```

#### Step 5: Start Development Server
```sh
npm run dev
```

## Keycloak Integration

Configure Keycloak realm and client settings in `.env`:
```sh
KEYCLOAK_CLIENT_ID=your-keycloak-client-id
KEYCLOAK_REALM=your-realm-name
KEYCLOAK_URL=your-keycloak-url
```

## Database Setup

Set up database credentials in `.env` and `config/database.js`:
```sh
DB_DIALECT=mssql
DB_USER=username
DB_PASSWORD=your-password
DB_NAME=your-db-name
DB_HOST=your-db-host
```

## Sequelize ORM

- Models are located in `db/models`.
- Use Sequelize CLI for migrations.
- **Important**: Do not delete `index.js` in models.

#### Creating Models with Auditing:
```sh
npx sequelize-cli model:generate --name <model_name> --attributes <attribute1>:<type>,<attribute2>:<type>,...,created_by:string,updated_by:string
```

Example:
```sh
npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,created_by:string,updated_by:string
```

#### Model Hooks for Auditing:
```js
yourModelName.beforeCreate((instance, options) => {
  instance.created_by = options.context.user.username;
  instance.updated_by = options.context.user.username;
});

yourModelName.beforeUpdate((instance, options) => {
  instance.updated_by = options.context.user.username;
});
```

#### Running Migrations:
```sh
npx sequelize-cli db:migrate
```

#### Managing Model Changes and Migrations:
```sh
npx sequelize-cli migration:generate --name add-column-to-table
```
Edit the migration file and run:
```sh
npx sequelize-cli db:migrate
```

## Mentioning Associations in Sequelize Models

Example:
```js
User.associate = (models) => {
  User.hasMany(models.Post, {
    foreignKey: 'userId',
    as: 'posts',
  });
};

Post.associate = (models) => {
  Post.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
};
```

## MSSQL and JSON/ENUM Handling

### JSON Handling
```js
metadata: {
  type: DataTypes.TEXT,
  allowNull: true,
  get() {
    return JSON.parse(this.getDataValue("metadata") || '{}');
  },
  set(value) {
    this.setDataValue("metadata", JSON.stringify(value));
  },
}
```

### ENUM Handling
```js
message_type: {
  type: DataTypes.STRING,
  validate: {
    isIn: [['text', 'image', 'video', 'file', 'sticker', 'gif']]
  }
}
```

## Model Mapping (Generic CRUD)

Create `modelMapping.js`:
```js
const db = require("./models");
exports.mapping = {
  message: db["Message"],
  conversation: db["Conversation"],
  file: db["File"],
};
```

## Security

Security headers are managed in `config/helmetConfig.js` and Keycloak authentication.

## Logging

- **HTTP Request Logging**: Morgan
- **Application Logging**: Winston

Example:
```js
const { logger } = require("../utils/logger");
logger.error({
  message: "Message error",
  error: error.message,
  stack: error.stack,
});
```

In `app.js`:
```js
app.use(httpLogger); // Use before defining routes.
```

## Error Handling

Custom error handling is in `utils/errorHandler.js`.

## API Endpoints

### Authentication
```sh
GET /api/users/me  # Get current user info (requires authentication)
```

### CRUD Operations
```sh
GET /api/<model>         # Get all records
GET /api/<model>/:id     # Get a specific record
POST /api/<model>        # Create a new record
PUT /api/<model>/:id     # Update a record
DELETE /api/<model>/:id  # Delete a record
```

### CRUD Middleware Workflow

- **authMiddleware**: Validates Keycloak token and handles file uploads.
- **crudMiddleware**:
  - Checks if the model is allowed for the HTTP method.
  - Proceeds to controller or throws a 404 error.

Example `config.js`:
```js
const allowedModels = {
  "GET": ["conversation", "message"],
  "POST": ["conversation", "message", "file"],
  "PUT": ["conversation", "message"],
  "DELETE": ["conversation"]
};
```

## Custom Routes

Define before CRUD routes in `app.js`:
```js
const testRouter = require("./routes/testRoute");
app.use("/api/test", testRouter);
```

Example `routes/testRoute.js`:
```js
const router = require('express').Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const testController = require('../controllers/testController');

router.post('/getdata', authMiddleware, testController.fetchData);

module.exports = router;
```

---
This template provides a secure and scalable backend for production-ready applications.


# ChatAI Feature Documentation

## Overview
ChatAI enhances backend applications with conversational AI, extending dynamic CRUD features with authentication middleware and utility functions.

## File Structure
### Controllers:
- `src/controllers/chatAiController.js` - Handles ChatAI-specific processing.

### Services:
- `src/services/chatAiService.js` - Implements business logic for messages and chatbot responses.

### Repository:
- `src/data/crudRepository.js` - Handles message storage and chatbot placeholders.

### Utilities:
- `src/utils/uploadFileHelper.js` - Manages file uploads (Azure Blob Storage).
- `src/utils/azureBlob.js` - Handles Azure Blob Storage operations.
- `src/utils/logger.js` - Logs errors and events.
- `src/utils/statusCodes.js` - Defines standard HTTP response codes.

### Middleware:
- `src/middlewares/authMiddleware.js` - Verifies Keycloak token.
- `src/middlewares/uploadMiddleware.js` - Handles file upload validation.
- `src/middlewares/crudMiddleware.js` - Validates allowed CRUD models.

### Endpoint Mapping:
- The `modelMapping.js` file maps API endpoints to the corresponding Sequelize models.
- Ensures generic CRUD operations route correctly.
- Throws an error if a model is not mapped.

## Integration Flow Summary
### Unified Request Routing:
- Routes requests for `message` to `chatAiController.addMessage`.

### Authentication & Middleware Processing:
- **Token Verification**: Handled by `authMiddleware` using Keycloak.
- **File Upload Handling**: Uses multer for validation.

### Controller & Service Processing:
1. User message is created.
2. Files are uploaded to Azure Blob Storage.
3. A placeholder chatbot message is created.
4. The LLM/agent API generates a chatbot reply.
5. The final response includes user and chatbot messages.

### Azure Blob Storage Integration:
- Folder path is defined in `.env` (`CONVERSATION_AZURE_FOLDER_PATH`).
- Uses Azure SDK and Managed Identity authentication.

## Environment Configuration
```sh
AZURE_ACCOUNT_NAME=your_azure_account
AZURE_CONTAINER_NAME=your_container
CONVERSATION_AZURE_FOLDER_PATH=your_folder
MEDIA_API_ENDPOINT=your_media_api
USE_MANAGED_IDENTITY=true
```

## ChatAI APIs
### Send Message
```sh
curl --location 'http://localhost:5000/api/message' \
--header 'Authorization: Bearer dummy_token_12345' \
--header 'Content-Type: multipart/form-data' \
--form 'conversation_id="789"' \
--form 'message="Hello, this is a test message!"' \
--form 'sender_type="user"' \
--form 'files=@"./path/to/your/file.txt"' \
--form 'message_type="text"'
```

### Retrieve Conversation
```sh
curl --location 'http://localhost:5000/api/conversation/123' \
--header 'Authorization: Bearer dummy_token_12345'
```

### Create Conversation
```sh
curl --location 'http://localhost:5000/api/conversation' \
--header 'Authorization: Bearer dummy_token_12345' \
--data '{
    "user_id": "456",
    "title": "How does Apple’s market share compare?",
    "conversation_metadata": {"topic": "How does Apple’s market share compare to its competitors?"}
}'
```

## Conclusion
This documentation provides an overview of the ChatAI feature in your Express.js backend application.

# File Upload & Download Feature Documentation

## Overview
The file upload and download feature enables secure and efficient handling of file operations within the application. It leverages middleware based on multer for processing uploads and integrates with Azure Blob Storage for storage and retrieval.

---
## File Upload Feature

### File Structure
#### Middleware:
- `src/middlewares/uploadMiddleware.js` 
  - Configures multer to handle file uploads in memory.
  - Enforces file size limits and validates allowed MIME types.

#### Utilities:
- `src/utils/uploadFileHelper.js`
  - Contains the `uploadFiles` function to process file uploads.
  - Calls the Azure Blob Storage integration for storage.
- `src/utils/azureBlob.js`
  - Handles integration with Azure Blob Storage using Managed Identity or Default Credentials.

### User Flow for File Uploads
The file upload process starts by calling the `uploadFiles` function from `uploadFileHelper.js` with the following parameters:
- **files**: Files uploaded by the user (`req.files` from multer).
- **folderPath**: Destination folder in Azure Blob Storage (derived from `.env` variable, e.g., `CONVERSATION_AZURE_FOLDER_PATH`).
- **options (optional)**: Additional configurations if required.

#### Usage:
```js
const result = await uploadFiles(req.files, folderPath, options);
```
This call:
- Validates inputs.
- Uploads files in parallel to Azure Blob Storage.
- Returns an array of file details, including URLs and metadata.

### Integration Flow Summary
#### Middleware Processing:
- **Token Verification**: `authMiddleware.js` ensures authentication using Keycloak.
- **File Upload Handling**: `uploadMiddleware.js` processes files securely.

#### Conditional Middleware Application:
In `authMiddleware.js`, file upload middleware is applied conditionally for certain routes:
```js
if (req.params.model === "message" || req.path === "/callback") { 
  // Upload file using multer
}
```

#### JSON Middleware Adjustment:
To avoid conflicts, `app.js` applies conditional JSON middleware:
```js
const jsonMiddleware = (req, res, next) => {  
  if (req.path !== '/api/message' && req.path !== '/api/llm/callback') {  
    express.json()(req, res, next);  
  } else {  
    next();  
  }  
};  
app.use(jsonMiddleware); 
```

#### Azure Blob Storage Integration:
- Constructs unique blob names for each file.
- Supports both Managed Identity and Default Credentials authentication.
- Uses environment variables for configuration.

### Environment Configuration
```sh
AZURE_ACCOUNT_NAME=your_azure_account
AZURE_CONTAINER_NAME=your_container
CONVERSATION_AZURE_FOLDER_PATH=your_folder
MEDIA_API_ENDPOINT=your_media_api
USE_MANAGED_IDENTITY=true
FILE_SIZE_LIMIT=5MB
ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf
```

---
## File Download Feature

### Overview
Securely retrieves files stored in Azure Blob Storage. Users receive a time-limited SAS (Shared Access Signature) URL to access the file.

### Endpoint: `GET /api/media/:filePath`
- **Description**: Redirects the user to the Azure Blob Storage file URL with a SAS token.
- **Authentication**: Requires authentication via `authMiddleware.js`.
- **Path Parameters**:
  - `filePath` (string) - The path of the file in Azure Blob Storage.

### Example Request:
```sh
curl --location 'http://localhost:5000/api/media/filepath' \
--header 'Authorization: Bearer <your_token>'
```

### Example Response:
#### Success:
```json
{
  "status": 200,
  "success": true,
  "message": "File URL retrieved successfully",
  "data": {
    "fileUrl": "<SAS-URL>"
  }
}
```

#### Error:
```json
{
  "status": 404,
  "success": false,
  "message": "File not found"
}
```

---
## Conclusion
The file upload and download feature ensures secure and efficient file handling by integrating multer-based middleware with Azure Blob Storage.

## WebSocket & Agent Processing (BullMQ + Redis)

This backend integrates real-time chat responses using **Socket.IO**, **Redis**, and **BullMQ** for scalable, asynchronous agent communication.

---

### 🧠 WebSocket Service (`socketService.js`)

- **Socket.IO + Redis Adapter**: Enables multi-instance support and room-based messaging.
- **Keycloak Authentication**: JWT-based middleware extracts user info from access tokens.
- **User & Conversation Rooms**: Authenticated users are joined to conversation-specific rooms (`dt:conversation:<id>`).
- **Connection Tracking**: Redis is used to map user IDs to socket connections and vice versa.
- **sendResponse Utility**: Sends messages either to active users directly or to a conversation room.
- **Graceful Disconnect**: Automatically removes connection data from Redis on socket disconnect.

---

### ⚙️ Background Agent Processing (BullMQ)

- **BullMQ Queue (`queueService.js`)**: Adds jobs like `callAgentAPI` for asynchronous processing.
- **Agent Worker (`agentWorker.js`)**: Processes messages in the background, executes agent logic.
- **Job Completion Handler (`jobCompletionHandler.js`)**: Notifies users of processed responses using WebSocket.

---

### 🧰 Redis Client (`redisClient.js`)

Centralized Redis setup for:
- **Socket.IO Scaling (Pub/Sub)**
- **BullMQ Queue Connection**
- **Connection Tracking**

---

### 🐳 Docker Support

- Includes `Dockerfile.worker` to run the agent processor in an isolated container.
- Example configuration provided via `docker-compose.worker.example` for setting up Redis and the worker on the same network.

---

This architecture ensures **real-time, scalable, and responsive communication** with background task handling for AI-powered chat applications.

# 🛡️ Express Validation Library

A lightweight, schema-based validation system for Express.js using `express-validator`. It supports both generic CRUD and custom routes with centralized error handling.


## ✅ Define Validation Schemas

- Files should be named as `{model}.schema.js` in `src/schemas/`.
- `model` must match the route param or be passed manually.

**Example – `conversation.schema.js`:**
```js
module.exports = {
  create: {
    user_id: {
      in: ["body"],
      notEmpty: true,
      isString: { errorMessage: "user_id must be a string" }
    },
    title: {
      in: ["body"],
      optional: true,
      isString: { errorMessage: "title must be a string" }
    }
  }
};
```

---

## 🧹 Middleware Usage

**Generic CRUD Routes – `crudRoutes.js`:**
```js
router.post('/:model', validate("create"), crudController.create);
```

**Custom Routes:**
```js
router.get('/users', validate("get_all", { model: "conversation" }), userController.getAllUsers);
```

If the model or schema is missing, validation will be skipped automatically.

---

## ❌ Error Format

If validation fails, the middleware throws a structured error:

```json
{
  "status": 400,
  "message": "Validation failed",
  "error": {
    "user_id": {
      "msg": "user_id must be a string",
      "path": "user_id",
      "location": "body"
    }
  }
}
```

---

## ✅ Best Practices

- Use `{model}.schema.js` naming convention
- Use `validate("actionkey")` or `validate("actionkey", { model: "modelName" })`
- Let global error handler catch and format validation errors

---
## Contact  
For any inquiries, reach out via [Aman Verma](mailto:aman.verma@tigeranalytics.com).
#   A S B _ F o r _ A P I  
 #   A S B _ F o r _ A P I  
 