// ==========================================
// 📘 OpenAPI 3.0 Specification — PS Game Rental Hub API
// ------------------------------------------------------
// Centralized, self-contained API description consumed by swagger-jsdoc
// and served through swagger-ui-express at GET /api-docs.
//
// This file documents the EXISTING API surface. It does not change any
// runtime behavior — it is purely additive documentation.
// ==========================================

const openapiDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'PS Game Rental Hub API',
    version: '1.0.0',
    description:
      'REST API for the PlayStation game rental platform. Supports three roles ' +
      '(**Gamer**, **Store**, **Admin**) with JWT-based authentication. Stores list ' +
      'games for rent, gamers rent them and manage a wishlist, and admins approve ' +
      'stores and manage users.',
    contact: { name: 'PS Rental Hub' },
    license: { name: 'ISC' },
  },
  servers: [
    { url: 'http://localhost:8080', description: 'Local development server' },
    { url: '/', description: 'Current host' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration, login, logout and current-user endpoints' },
    { name: 'Games', description: 'Browse, create, update and delete rental games' },
    { name: 'Rentals', description: 'Checkout, returns and rental history' },
    { name: 'Users', description: 'User administration (admin) and profile management' },
    { name: 'Wishlist', description: 'Per-user game wishlist' },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Send the JWT returned by /api/auth/login as `Authorization: Bearer <token>`.',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT stored in the httpOnly `token` cookie set at login. Note: most protected API endpoints require the Bearer header specifically.',
      },
    },

    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          username: { type: 'string', example: 'ahmed_gamer' },
          email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
          role: { type: 'string', enum: ['Gamer', 'Store', 'Admin'], example: 'Gamer' },
          storeID: { type: 'string', nullable: true, example: '665f1a2b3c4d5e6f7a8b9c0d' },
          phone: { type: 'string', example: '01012345678' },
          approved: { type: 'boolean', example: true },
          wishlist: {
            type: 'array',
            items: { type: 'string', description: 'Game ObjectId' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      Game: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          gameID: { type: 'string', example: 'lwz3k8-a1b2c3' },
          storeID: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          customerID: { type: 'string', nullable: true, example: null },
          status: { type: 'string', enum: ['Available', 'Rented', 'Maintenance'], example: 'Available' },
          title: { type: 'string', example: 'God of War Ragnarök' },
          type: { type: 'string', example: 'Game' },
          platform: { type: 'string', enum: ['PS4', 'PS5', 'PS4 & PS5'], example: 'PS5' },
          pricePerDay: { type: 'number', minimum: 0, example: 25 },
          category: { type: 'string', example: 'Action-Adventure' },
          img: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/god-of-war.jpg' },
          images: { type: 'array', items: { type: 'string' } },
          description: { type: 'string', example: 'Embark on an epic journey...' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      Rental: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          customer: { type: 'string', description: 'User ObjectId (or populated User)' },
          game: { type: 'string', description: 'Game ObjectId (or populated Game)' },
          startDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          pricePerDay: { type: 'number', example: 25 },
          totalPrice: { type: 'number', example: 175 },
          phone: { type: 'string', example: '01012345678' },
          address: { type: 'string', example: '12 Nasr City, Cairo' },
          status: { type: 'string', enum: ['active', 'returned', 'overdue'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      Review: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          customer: { type: 'string', description: 'User ObjectId' },
          game: { type: 'string', description: 'Game ObjectId' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', example: 'Great game, highly recommend!' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ---- Request bodies ----
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password', 'role'],
        properties: {
          username: { type: 'string', minLength: 3, example: 'ahmed_gamer' },
          email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
          password: { type: 'string', minLength: 6, format: 'password', example: 'secret123' },
          role: { type: 'string', enum: ['Gamer', 'Store'], example: 'Gamer' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
          password: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      CreateAdminRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, example: 'root_admin' },
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', minLength: 6, format: 'password', example: 'secret123' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, example: 'new_name' },
          email: { type: 'string', format: 'email', example: 'new@example.com' },
          phone: { type: 'string', description: 'Egyptian mobile number', example: '01012345678' },
          role: { type: 'string', enum: ['Gamer', 'Store', 'Admin'], description: 'Admin only' },
        },
      },
      CheckoutRequest: {
        type: 'object',
        required: ['items', 'phone', 'address'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['gameId', 'days'],
              properties: {
                gameId: { type: 'string', description: 'Game _id or gameID', example: '665f1a2b3c4d5e6f7a8b9c0d' },
                days: { type: 'integer', minimum: 1, maximum: 30, example: 7 },
              },
            },
          },
          phone: { type: 'string', example: '01012345678' },
          address: { type: 'string', example: '12 Nasr City, Cairo' },
        },
      },
      GameInput: {
        type: 'object',
        required: ['title', 'category', 'platform', 'pricePerDay', 'images'],
        properties: {
          title: { type: 'string', maxLength: 100, example: 'God of War Ragnarök' },
          description: { type: 'string', maxLength: 2000 },
          category: { type: 'string', example: 'Action-Adventure' },
          platform: { type: 'string', enum: ['PS4', 'PS5', 'PS4 & PS5'], example: 'PS5' },
          pricePerDay: { type: 'number', minimum: 0.01, example: 25 },
          type: { type: 'string', example: 'Game' },
          images: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Up to 5 image files (multipart/form-data field name: images)',
          },
        },
      },

      // ---- Generic responses ----
      MessageResponse: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Operation successful' } },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Something went wrong' },
          error: { type: 'string', example: 'Detailed error message' },
        },
      },
    },

    responses: {
      Unauthorized: {
        description: 'Missing, invalid or expired authentication token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Authenticated but not permitted to perform this action',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Invalid request payload',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ServerError: {
        description: 'Unexpected server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },

  // No global security — each operation declares its own so public routes stay open.
  security: [],

  paths: {
    // ============ AUTH ============
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new Gamer or Store account',
        description: 'Store accounts are created unapproved and cannot log in until an Admin approves them. `/api/auth/signup` is an alias of this endpoint.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: {
            description: 'Account created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Alias of /api/auth/register',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        description: 'Returns a JWT (also set as an httpOnly cookie) valid for 1 day. Unapproved Store accounts receive 403.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out (clears the token cookie)',
        responses: {
          200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the currently authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ============ GAMES ============
    '/api/games': {
      get: {
        tags: ['Games'],
        summary: 'List games',
        description: 'Public. Defaults to `Available` games. Pass `?status=all` for every game or `?status=Rented` to filter.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', example: 'all' },
            description: "Filter by status, or 'all' for every game",
          },
        ],
        responses: {
          200: { description: 'Array of games', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Game' } } } } },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      post: {
        tags: ['Games'],
        summary: 'Add a new game (Store/Admin)',
        description: 'Multipart form upload with up to 5 images. Requires Store or Admin role.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/GameInput' } } },
        },
        responses: {
          201: { description: 'Game created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Game' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/games/my/games': {
      get: {
        tags: ['Games'],
        summary: "List the logged-in store's games (Store)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Store games',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    results: { type: 'integer', example: 3 },
                    data: { type: 'object', properties: { games: { type: 'array', items: { $ref: '#/components/schemas/Game' } } } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/games/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Game _id or gameID' }],
      get: {
        tags: ['Games'],
        summary: 'Get a single game by _id or gameID',
        responses: {
          200: { description: 'Game', content: { 'application/json': { schema: { $ref: '#/components/schemas/Game' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      put: {
        tags: ['Games'],
        summary: 'Update a game (Store owner/Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/GameInput' } } },
        },
        responses: {
          200: { description: 'Updated game', content: { 'application/json': { schema: { $ref: '#/components/schemas/Game' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      delete: {
        tags: ['Games'],
        summary: 'Delete a game (Store owner/Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ============ RENTALS ============
    '/api/rentals/checkout': {
      post: {
        tags: ['Rentals'],
        summary: 'Rent one or more games',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutRequest' } } },
        },
        responses: {
          201: {
            description: 'Rentals confirmed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    rentals: { type: 'array', items: { $ref: '#/components/schemas/Rental' } },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/rentals/my': {
      get: {
        tags: ['Rentals'],
        summary: "Get the logged-in user's rentals",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Rentals', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Rental' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/rentals/store': {
      get: {
        tags: ['Rentals'],
        summary: "Get rentals for the store's games (Store)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Rentals', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Rental' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/rentals/{id}/return': {
      patch: {
        tags: ['Rentals'],
        summary: 'Return a rented game',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Rental _id' }],
        responses: {
          200: {
            description: 'Returned',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, rental: { $ref: '#/components/schemas/Rental' } } } } },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/rentals': {
      get: {
        tags: ['Rentals'],
        summary: 'Get all rentals (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All rentals', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Rental' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ============ USERS ============
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/users/admin': {
      post: {
        tags: ['Users'],
        summary: 'Create a new Admin (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } } },
        },
        responses: {
          201: { description: 'Admin created', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User _id' }],
      get: {
        tags: ['Users'],
        summary: 'Get a user (Admin or the user themselves)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update a user (Admin or the user themselves)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } } },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user (Admin)',
        description: 'Cascades: deletes a Store\'s games, and returns a Gamer\'s active rentals.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/users/{id}/approve': {
      patch: {
        tags: ['Users'],
        summary: 'Approve a pending Store account (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Store user _id' }],
        responses: {
          200: { description: 'Approved', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ============ WISHLIST ============
    '/api/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: "Get the logged-in user's wishlist (populated games)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Wishlist games', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Game' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/api/wishlist/{gameId}': {
      parameters: [{ name: 'gameId', in: 'path', required: true, schema: { type: 'string' }, description: 'Game _id or gameID' }],
      post: {
        tags: ['Wishlist'],
        summary: 'Add a game to the wishlist',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Added', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
      delete: {
        tags: ['Wishlist'],
        summary: 'Remove a game from the wishlist',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Removed', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
  },
};

module.exports = openapiDefinition;
