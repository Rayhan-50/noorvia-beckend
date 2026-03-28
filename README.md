# Noorvia Backend Server

Welcome to the backend server for the **Noorvia** project. This is a RESTful API built with **Node.js**, **Express.js**, and **MongoDB**, featuring robust JWT-based authentication and role-based access control.

## 🚀 Features

- **JWT Authentication:** Secure token-based authentication to protect private routes.
- **Role-Based Access Control:** Differentiated access for `admin` and regular users.
- **User Management:** APIs to create, read, update, and delete user profiles, as well as promote users to admin status.
- **Team Directory:** Manage team members, roles, and their active status.
- **Performer Applications:** Public submission and admin management of performer applications.
- **Contact Submissions:** Public contact form endpoints with protected admin management.
- **CORS Configured:** Secure cross-origin tracking and connection tailored to specific client domains.

## 🛠️ Technology Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (using `mongodb` native driver)
- **Authentication:** JSON Web Tokens (JWT)
- **Environment Management:** dotenv
- **Middleware:** cors, express.json

## 📋 API Endpoints Summary

### Authentication
- **`POST /jwt`** - Generate an access token based on user payload.

### Users Management
- **`POST /users`** - Register a new user.
- **`GET /users`** - Retrieve all users *(requires token)*.
- **`GET /users/admin/:email`** - Check if a specific user is an admin *(requires token)*.
- **`PATCH /users/admin/:id`** - Promote a user to admin role.
- **`PUT /users/:email`** - Update user details *(requires token)*.
- **`DELETE /users/:id`** - Remove a user.

### Team Members
- **`GET /team`** - List all active team members *(Public)*.
- **`GET /team/:id`** - Retrieve a specific team member details *(Public)*.
- **`POST /team`** - Add a new team member *(requires token & admin)*.
- **`PATCH /team/:id`** - Update team member details *(requires token & admin)*.
- **`DELETE /team/:id`** - Delete a team member *(requires token & admin)*.

### Performers
- **`POST /performers`** - Submit a new performer application *(Public)*.
- **`GET /performers`** - Retrieve all performer applications *(requires token & admin)*.
- **`GET /performers/:id`** - Retrieve a single performer application *(requires token & admin)*.
- **`PATCH /performers/:id`** - Update status/details of a performer application *(requires token & admin)*.
- **`DELETE /performers/:id`** - Delete a performer application *(requires token & admin)*.

### Contacts
- **`POST /contacts`** - Submit a contact form *(Public)*.
- **`GET /contacts`** - Retrieve all contact submissions *(requires token & admin)*.
- **`DELETE /contacts/:id`** - Delete a contact submission *(requires token & admin)*.

## 💻 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd noorvia-beckend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   PORT=5000
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   ACCESS_TOKEN_SECRET=your_jwt_secret_token
   CLIENT_ADDRESS=your_production_frontend_url
   DEV_CLIENT=your_local_frontend_url
   ```

4. **Run the server:**
   ```bash
   npm start
   ```
   The server will start on port `5000` (or `PORT` specified in `.env`).

## 👨‍💻 Author Info

**Rayhan Ahmed**
- **LinkedIn:** [Rayhan Ahmed](https://www.linkedin.com/in/rayhan-ahmed-0ab5aa33a/)
- **GitHub:** [Rayhan-50](https://github.com/Rayhan-50)
- **Email:** [rayhanahmed.nstu@gmail.com](mailto:rayhanahmed.nstu@gmail.com)
