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
