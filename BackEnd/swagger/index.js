// ==========================================
// 📘 Swagger / OpenAPI setup
// ------------------------------------------------------
// Builds the OpenAPI spec (via swagger-jsdoc) from the centralized
// definition in ./openapi.js, and mounts Swagger UI at /api-docs.
//
// swagger-jsdoc also scans the route files for any future `@openapi`
// JSDoc annotations and merges them in, so the docs can be extended
// inline later without changing this setup.
// ==========================================

const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const openapiDefinition = require('./openapi');

const swaggerSpec = swaggerJsdoc({
  definition: openapiDefinition,
  apis: [
    path.join(__dirname, '..', 'Routes', '*.js'),
    path.join(__dirname, '..', 'Controllers', '*.js'),
  ],
});

/**
 * Mount Swagger UI and the raw OpenAPI JSON on an Express app.
 * @param {import('express').Express} app
 */
function mountSwagger(app) {
  // Interactive docs UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'PS Game Rental Hub API Docs',
    })
  );

  // Raw spec for tooling / codegen (Postman, client generators, etc.)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📘 API docs available at /api-docs (spec: /api-docs.json)');
}

module.exports = { swaggerSpec, mountSwagger };
