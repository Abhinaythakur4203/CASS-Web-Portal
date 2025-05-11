# Computer Application Student Society (CASS) Web Portal

## Overview

The Computer Application Student Society (CASS) web portal is a comprehensive backend application meticulously engineered for the Computer Application Department of the "Sikkim Manipal Institute of Technology" (SMIT). This portal serves as a centralized platform to manage and streamline various activities and information related to the student society. The primary goal of this project is to provide a robust, scalable, and secure backend infrastructure that supports the diverse needs of CASS, including event management, content dissemination, user engagement, and administrative operations. Built with a modern JavaScript technology stack, the portal aims to enhance the digital presence of CASS and improve operational efficiency.

## Features

-   **User Authentication and Authorization**: Implements a secure authentication system using JSON Web Tokens (JWT). It provides role-based access control (RBAC) to differentiate functionalities available to administrators, content managers, and general users, ensuring that users can only access resources appropriate to their roles.
-   **Event Management**: Allows administrators to create, update, retrieve, and delete events. Each event can include details such as title, description, date, venue, and multimedia content (images/videos). This feature helps in keeping the students informed about upcoming and past CASS activities.
-   **Newsletter Management**: Facilitates the creation and distribution of newsletters. Administrators can manage newsletter content, including text and embedded media, to keep the CASS members updated on recent developments, achievements, and announcements.
-   **Gallery Management**: Provides a system for creating and managing image galleries. This feature allows CASS to showcase photographs from various events and activities, preserving memories and promoting engagement.
-   **Feedback System**: Enables the collection and management of feedback for events and other activities. This helps in gauging user satisfaction and gathering suggestions for improvement.
-   **Faculty Management**: Allows for the management of faculty member profiles associated with the Computer Application Department. Administrators can add, update, and delete faculty information, including their details and photographs.
-   **Registration System**: Provides a streamlined process for users to register for CASS events. It also allows administrators to manage and track event registrations efficiently.
-   **Secure File Uploads**: Integrates with Cloudinary for secure and efficient handling of media uploads. All images and other media files are stored and delivered through Cloudinary, optimizing performance and reducing server load.

## Technologies Used

-   **Node.js**: A JavaScript runtime environment chosen for its non-blocking, event-driven architecture, enabling the development of fast and scalable network applications. It allows for the use of JavaScript on the server-side, promoting a unified language across the stack.
-   **Express.js**: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It simplifies the process of building RESTful APIs and managing HTTP requests and responses.
-   **MongoDB**: A NoSQL, document-oriented database selected for its flexibility, scalability, and ease of use with JavaScript. Its schema-less nature allows for easier evolution of the data model.
-   **Mongoose**: An Object Data Modeling (ODM) library for MongoDB and Node.js. It provides a schema-based solution to model application data, offering built-in type casting, validation, query building, and business logic hooks.
-   **Cloudinary**: A cloud-based media management platform used for storing, transforming, optimizing, and delivering images and videos. It offloads the complexities of media handling from the application server.
-   **JSON Web Tokens (JWT)**: An open standard (RFC 7519) for securely transmitting information between parties as a JSON object. Used for implementing stateless authentication and authorization.
-   **Multer**: A Node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files. It simplifies the process of extracting files from incoming requests.
-   **Helmet**: A security middleware for Express.js applications that helps protect against common web vulnerabilities by setting various HTTP headers appropriately.
-   **dotenv**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`, allowing for a clean separation of configuration from code.

## Project Structure

The project is organized into a modular structure to promote separation of concerns, maintainability, and scalability.

```
CASS-Web-Portal/
├── public/                # Contains static assets accessible by the client.
│   └── temp/             # Temporary storage for files during upload processes before they are moved to a persistent store like Cloudinary.
├── src/                   # Core application source code.
│   ├── app.js            # The main Express application setup file. Configures middleware, routes, and error handling.
│   ├── constant.js       # Defines application-wide constants, such as database name, status codes, or default values.
│   ├── index.js          # The entry point of the application. Initializes the server and connects to the database.
│   ├── controllers/      # Contains the business logic for handling requests. Each file typically corresponds to a specific resource (e.g., events, users).
│   ├── db/               # Database connection logic and configuration (e.g., connecting to MongoDB using Mongoose).
│   ├── middleware/       # Custom Express middleware. Includes authentication checks (auth.middleware.js) and file upload handling (multer.middleware.js).
│   ├── models/           # Mongoose schemas and models defining the structure of the data stored in MongoDB.
│   ├── routes/           # Defines the API endpoints and maps them to the appropriate controller functions.
│   └── utils/            # Utility functions and helper classes used across the application (e.g., standardized API response/error handling, Cloudinary integration).
├── .env                   # Stores environment-specific configuration variables (e.g., database URI, API keys, secrets). This file is not committed to version control.
├── .gitignore             # Specifies intentionally untracked files that Git should ignore (e.g., node_modules, .env, temporary files).
├── package.json           # Project metadata, including dependencies, scripts for running, testing, and building the application.
└── README.md              # This file, providing documentation for the project.
```

## API Endpoints

The following are the primary API endpoints provided by the CASS Web Portal.

### Authentication (`/api/v1/admin`)

-   **`POST /registerAdmin`**: Registers a new administrator. Requires admin credentials in the request body.
-   **`POST /login`**: Logs in an existing administrator. Requires email and password. Returns JWT access and refresh tokens upon successful authentication.
-   **`POST /logout`**: Logs out the currently authenticated administrator. Requires a valid access token.
-   **`POST /refresh-token`**: Refreshes an expired access token using a valid refresh token.
-   **`POST /change-password`**: Allows an authenticated administrator to change their password. Requires the current and new passwords.
-   **`GET /validate-token`**: Validates the authenticity and expiration of an access token.

### Event Management (`/api/v1/Events`)

-   **`GET /`**: Retrieves a list of all events. Supports pagination and filtering.
-   **`GET /:identifier`**: Fetches a specific event by its ID, title, or a unique slug.
-   **`POST /create`**: Creates a new event. Requires event details and an optional media file (e.g., event poster) in the request body. (Admin access required)
-   **`PATCH /update/:id`**: Updates an existing event identified by its ID. Allows modification of event details and media. (Admin access required)
-   **`DELETE /delete/:id`**: Deletes an event identified by its ID. (Admin access required)

### Newsletter Management (`/api/v1/newsletter`)

-   **`GET /`**: Retrieves all newsletters.
-   **`POST /create`**: Creates a new newsletter. Requires newsletter content and optional media. (Admin access required)
-   **`PATCH /update/:id`**: Updates an existing newsletter identified by its ID. (Admin access required)
-   **`DELETE /delete/:id`**: Deletes a newsletter identified by its ID. (Admin access required)

### Gallery Management (`/api/v1/gallery`)

-   **`GET /`**: Retrieves all image galleries.
-   **`GET /:id`**: Fetches a specific gallery by its ID, including all its images.
-   **`POST /create`**: Creates a new gallery. Requires gallery title and initial images. (Admin access required)
-   **`PATCH /add-images/:id`**: Adds new images to an existing gallery identified by its ID. (Admin access required)
-   **`DELETE /delete/:id`**: Deletes an entire gallery identified by its ID. (Admin access required)
-   **`DELETE /delete-image/:id/:imageId`**: Deletes a specific image (identified by `imageId`) from a gallery (identified by `id`). (Admin access required)

### Feedback System (`/api/v1/feedback`)

-   **`POST /add/:eventId`**: Submits feedback for a specific event (identified by `eventId`). Requires feedback content from the user.
-   **`GET /`**: Retrieves all feedback entries. (Admin access required)
-   **`GET /event/:eventId`**: Fetches all feedback associated with a specific event. (Admin access required)
-   **`DELETE /:id`**: Deletes a specific feedback entry by its ID. (Admin access required)
-   **`DELETE /`**: Deletes all feedback entries. (Admin access required, use with caution)

### Faculty Management (`/api/v1/faculty`)

-   **`GET /`**: Retrieves a list of all faculty members.
-   **`POST /add`**: Adds a new faculty member. Requires faculty details and an optional photograph. (Admin access required)
-   **`PATCH /update/:type/:id`**: Updates an existing faculty member's details or photograph. `:type` can specify 'details' or 'avatar'. (Admin access required)
-   **`DELETE /delete/:type/:id`**: Deletes a faculty member or their avatar. `:type` can specify 'details' or 'avatar'. (Admin access required)

### Registration System (`/api/v1/register`)

-   **`GET /event/:eventId`**: Retrieves all registrations for a specific event. (Admin access required)
-   **`POST /create/:eventId`**: Registers a user for a specific event. Requires user details.
-   **`GET /user`**: Fetches all event registrations for the currently authenticated user (if applicable, or based on provided user identifier).
-   **`DELETE /delete/:eventId`**: Deletes all registrations for a specific event. (Admin access required)
-   **`DELETE /delete`**: Deletes all registration entries across all events. (Admin access required, use with caution)

### File Uploads (`/api/v1/upload`)

-   **`POST /image`**: A generic endpoint for uploading an image. The uploaded image is typically processed and stored via Cloudinary. Returns the URL of the uploaded image. (Protected, requires authentication)

## Environment Variables

The application relies on environment variables for configuration, promoting security and flexibility across different deployment environments. These variables are typically stored in a `.env` file in the project root during development.

| Variable                | Description                                                                 | Example                                     |
| :---------------------- | :-------------------------------------------------------------------------- | :------------------------------------------ |
| `PORT`                  | The port number on which the Node.js server will listen for incoming requests. | `8000`                                      |
| `MONGODB_URI`           | The connection string for the MongoDB database.                             | `mongodb://localhost:27017/cass_portal`     |
| `ACCESS_TOKEN_SECRET`   | A secret key used to sign and verify JWT access tokens.                     | `your-super-secret-access-token-key`        |
| `REFRESH_TOKEN_SECRET`  | A secret key used to sign and verify JWT refresh tokens.                    | `your-super-secret-refresh-token-key`       |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary account's cloud name.                                       | `your-cloudinary-cloud-name`                |
| `CLOUDINARY_API_KEY`    | Your Cloudinary account's API key.                                          | `123456789012345`                           |
| `CLOUDINARY_API_SECRET` | Your Cloudinary account's API secret.                                       | `your-cloudinary-api-secret`                |
| `CORS_ORIGIN`           | Specifies the origins allowed to make cross-origin requests to the server.  | `http://localhost:3000` or `*` for all    |
| `DB_NAME`               | The name of the database to be used within MongoDB.                         | `CASS_WEB_PORTAL`                           |


## Contribution Guidelines

We welcome contributions to enhance the CASS Web Portal. To ensure a smooth collaboration process, please follow these guidelines:

1.  **Fork the Repository**: Start by forking the main repository to your personal GitHub account.
2.  **Create a Feature Branch**: For any new feature or bug fix, create a new branch from the `main` (or `develop` if applicable) branch. Use a descriptive branch name (e.g., `feature/add-event-search` or `fix/login-bug`).
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  **Code Style**: Adhere to the existing coding style and conventions used in the project. Ensure your code is clean, well-commented, and readable.
4.  **Commit Messages**: Write clear, concise, and descriptive commit messages. Follow conventional commit formats if possible (e.g., `feat: add user profile endpoint`).
5.  **Testing**: If applicable, write unit or integration tests for your changes. Ensure all existing tests pass before submitting your contribution.
6.  **Pull Request (PR)**:
    *   Push your changes to your forked repository.
    *   Create a Pull Request against the `main` (or `develop`) branch of the original repository.
    *   Provide a detailed description of the changes made in your PR, including the problem solved or the feature added.
    *   Link any relevant issues in your PR description.
7.  **Code Review**: Your PR will be reviewed by project maintainers. Be prepared to address any feedback or make further changes as requested.
8.  **Stay Updated**: Keep your local branch and fork updated with the latest changes from the upstream repository.

## License

This project is licensed under the ISC License. See the `LICENSE` file (if present, otherwise assume ISC) for more details. The ISC license is a permissive free software license, functionally equivalent to the simplified BSD and MIT licenses.

## Contact

For any queries, issues, or suggestions regarding the CASS Web Portal, please feel free to reach out to the project maintainer:

-   **Name**: Abhinay Thakur
-   **Email**: [abhinaythakur4203@email.com](mailto:abhinaythakur4203@email.com)
-   **GitHub**: [Abhinaythakur4203](https://github.com/Abhinaythakur4203)