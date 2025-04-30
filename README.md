Blog Backend API (NestJS)
=========================

This is the backend API for a simple blog application built using [NestJS](https://nestjs.com/ "null"), [Prisma](https://www.prisma.io/ "null"), and [MySQL](https://www.mysql.com/ "null").

Description
-----------

This project provides API endpoints to manage blog posts, categories, tags, comments, users, along with an authentication and role-based access control (RBAC) system inspired by Spatie Laravel Permission.

Core Technologies
-----------------

-   Framework: NestJS v11.0.7

-   Language: TypeScript

-   Database: MySQL

-   ORM: Prisma v6.7.0

-   Authentication: JWT (JSON Web Tokens) via Passport.js (`@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`)

-   Validation: `class-validator`, `class-transformer`

-   Password Hashing: `bcrypt`

-   File Upload: (Currently) Local Storage via Multer (planned)

Key Features (Based on Planning)
--------------------------------

-   Authentication:

    -   User Registration (with auto-login)

    -   User Login (via username or email)

    -   Route Protection using JWT

-   Authorization (RBAC):

    -   Role Management

    -   Permission Management

    -   Assigning Roles to Users

    -   Assigning Permissions to Roles (and/or directly to Users)

    -   Role Guard (`RolesGuard`)

    -   Permission Guard (`PermissionsGuard`)

    -   Super Role Concept (bypasses permission checks)

-   User Management:

    -   Basic User CRUD (to be developed)

    -   User profile endpoint (`/users/me`)

-   Post Management: (Upcoming)

    -   CRUD Posts

    -   Automatic Slug Generation

    -   Draft/Published Status

    -   Relations to Author, Category, Tags

-   Category Management: (Upcoming)

-   Tag Management: (Upcoming)

-   Comment Management: (Upcoming)

    -   Comment Moderation

-   Image Upload: (Upcoming - currently planned for local storage)

Getting Started
---------------

### Prerequisites

-   Node.js (LTS version recommended)

-   NPM or Yarn

-   MySQL Server

-   Git

### Installation

1.  Clone the repository:

    ```
    git clone https://github.com/xmazlan/nestjs-blog-backend.git
    cd nestjs-blog-backend

    ```

2.  Install dependencies:

    ```
    npm install
    # or
    yarn install

    ```

3.  Set Up Environment Variables:

    -   Copy the `.env.example` file (if you create one) to `.env`.

    -   Or create a new `.env` file in the project root.

    -   Fill in the following variables in your `.env` file:

        ```
        # Adjust to your MySQL database connection
        DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

        # Replace with a strong, secret key!
        JWT_SECRET="YOUR_STRONG_SECRET_KEY_HERE"

        # Optional: Application port (defaults to 3000)
        # PORT=3000

        ```

4.  Database Migration:

    -   Ensure the database specified in `DATABASE_URL` exists in your MySQL server.

    -   Run Prisma migrations to create the table schema:

        ```
        npx prisma migrate dev

        ```

5.  Database Seeding (Optional but recommended):

    -   Run the seeder to populate initial data (roles, permissions, admin user):

        ```
        npx prisma db seed

        ```

### Running the Application

-   Development Mode (with hot-reload):

    ```
    npm run start:dev
    # or
    yarn start:dev

    ```

-   Production Mode:

    ```
    npm run build
    npm run start:prod
    # or
    yarn build
    yarn start:prod

    ```

The application will run on the specified port (default 3000).

API Documentation
-----------------

You can use API client tools like Postman or Insomnia to test the API endpoints.

-   Base URL: `http://localhost:3000` (or as configured)

-   (Further endpoint documentation will be added or can be inferred from the controller code).

Contributing
------------

Currently, contributions are handled solely by [xmazlan](https://github.com/xmazlan "null").

License
-------

This project is licensed under the [MIT License](https://gemini.google.com/app/LICENSE "null"). (Remember to add a `LICENSE` file with the MIT license text).