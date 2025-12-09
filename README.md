# User Management Service

A RESTful service for user management.

---

## Dependencies
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## How to Run
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/plumbicon/ai-hunt-nodejs
    cd user-service
    ```

2.  **Create a `.env` file:**
    Copy `.env.example` and fill in your data.
    ```bash
    cp .env.example .env
    ```
    > **Important:** Replace `your_postgres_password` and the JWT secret keys with your own values.
    >
    > Also add/check the `CREATE_ADMIN` variable:
    > - `CREATE_ADMIN=true` — when the server starts (if there is no admin account), an administrator account will be created and a temporary password will be displayed in the console. For production, it is recommended to leave `CREATE_ADMIN=false` and create an admin manually.
    >
    > Required variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `PORT` (default 6000).

3.  **Run the project using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
The server will be available at http://localhost:${PORT}, where `PORT` is the value specified in your `.env` file (default 6000).

---

## Testing

The project is configured with a comprehensive test suite using [Jest](https://jestjs.io/) and [Supertest](https://github.com/visionmedia/supertest). The tests run against a separate, temporary PostgreSQL database to ensure a clean environment and prevent interference with development data.

### Setup

Before running the tests, you need to configure the environment variables for the test database. The test runner uses the same `.env` file but requires specific values to connect to the database instance managed by Docker Compose.

1.  **Ensure your `.env` file is present.** If not, copy it from `.env.example`.
2.  **Configure the test connection variables.** The most important part is the port. Your application connects to the database *within* the Docker network on port `5432`, but tests run from your host machine must connect to the *exposed* port.

    Make sure your `.env` file contains these values. The `DB_PORT` variable defines the port exposed on your host machine for running tests.

    ```env
    DB_HOST=localhost
    DB_PORT=5433      # Exposed host port for tests. Defaults to 5433 if not set.
    DB_NAME_TEST=test_app_db
    DB_USER=myuser
    DB_PASSWORD=mypassword
    ```

### Running Tests

First, ensure your Docker containers are running:
```bash
docker-compose up -d
```

Then, run the entire test suite with the following command:

```bash
npm test
```

The test script will automatically:
1.  Create the temporary test database (`test_app_db`).
2.  Apply all migrations to set up the schema.
3.  Run all tests.
4.  Roll back the migrations.
5.  Drop the temporary test database.

### What is Tested?

The test suite covers all API endpoints, including:

-   **Authentication (`/api/auth`)**:
    -   Successful user registration.
    -   Preventing registration with a duplicate email.
    -   Successful login with correct credentials.
    -   Failed login with incorrect password or non-existent user.
-   **User Management (`/api/users`)**:
    -   **Authorization**: Verifies that access rules for different user roles (`admin` vs. `user`) are enforced correctly.
    -   **Get All Users**: Checks that only admins can retrieve the full user list.
    -   **Get User by ID**: Checks that users can view their own profile and that admins can view any profile.
    -   **Block User**: Verifies the block logic and, crucially, confirms that a blocked user can no longer log in.

---

## API Endpoints

### 1. Registration
Creating a new user. To create a user with the `admin` role, you must provide the `accessToken` of another administrator.

**POST** `/api/auth/register`
**Body:**
```json
{
  "fullName": "Ivan Ivanov",
  "birthDate": "1990-01-15",
  "email": "ivan@example.com",
  "password": "strongpassword123",
  "role": "user"
}
```
**Possible Errors:**
- `400 Bad Request` - One of the required fields (`fullName`, `birthDate`, `email`, `password`) is missing.
- `401 Unauthorized` - An administrator's `accessToken` is required to create an `admin` user, but it was not provided or is invalid.
- `403 Forbidden` - The provided token does not grant administrator privileges.
- `409 Conflict` - A user with this email already exists.
- `500 Internal Server Error` - An unexpected error occurred on the server.

### 2. Authorization (Login)
Getting `accessToken`.

**POST** `/api/auth/login`
**Body:**
```json
{
  "email": "ivan@example.com",
  "password": "strongpassword123"
}
```
**Response:**
```json
{
  "accessToken": "..."
}
```
**Possible Errors:**
- `400 Bad Request` - The `email` or `password` field is missing.
- `401 Unauthorized` - Authentication failed (incorrect login or password).
- `500 Internal Server Error` - An unexpected error occurred on the server.

### 3. Get User Data
`accessToken` required. Available to administrator or account owner.

**GET** `/api/users/:id`
**Headers:**
`Authorization: Bearer <accessToken>`

**Possible Errors:**
- `401 Unauthorized` - `accessToken` is missing.
- `403 Forbidden` - The token is invalid, has expired, or you are trying to access another user's data without being an administrator.
- `404 Not Found` - The user with the specified `id` was not found.
- `500 Internal Server Error` - An unexpected error occurred on the server.

### 4. Block User
`accessToken` required. Available to administrator or account owner.

**PATCH** `/api/users/:id/block`
**Headers:**
`Authorization: Bearer <accessToken>`
**Body:** Not required — blocking is performed on the server (will be set to `isBlocked: true`).

**Possible Errors:**
- `401 Unauthorized` - `accessToken` is missing.
- `403 Forbidden` - The token is invalid, has expired, or you are trying to block another user without being an administrator.
- `404 Not Found` - The user with the specified `id` was not found.
- `500 Internal Server Error` - An unexpected error occurred on the server.

### 5. Get User List
`accessToken` of a user with the `admin` role is required. Supports pagination.

**GET** `/api/users?page=1&limit=10`
**Headers:**
`Authorization: Bearer <accessToken>`
**Query Parameters (Optional):**
- `page` (number): The page number to retrieve. Default: `1`.
- `limit` (number): The number of users per page. Default: `10`.

**Response (Example):**
```json
{
  "totalItems": 50,
  "totalPages": 5,
  "currentPage": 1,
  "users": [
    {
      "id": "...",
      "fullName": "...",
      "birthDate": "...",
      "email": "...",
      "role": "...",
      "isBlocked": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Possible Errors:**
- `401 Unauthorized` - `accessToken` is missing.
- `403 Forbidden` - The token is invalid, has expired, or the user is not an administrator.
- `500 Internal Server Error` - An unexpected error occurred on the server.

---

## User Model

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier |
| `fullName` | String | User's full name |
| `birthDate`| Date | Date of birth |
| `email` | String | Unique email, used for login |
| `password` | String | Hashed password |
| `role` | Enum | User role (`user` or `admin`) |
| `isBlocked`| Boolean | Blocking status (`true` - blocked) |
| `createdAt`| Date | Creation date |
| `updatedAt`| Date | Last update date |
