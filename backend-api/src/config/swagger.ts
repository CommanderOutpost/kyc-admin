import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "KYC Admin API",
      version: "1.0.0",
      description: "Subscriptions + KYC Admin backend API"
    },
    servers: [
      {
        url: "http://localhost:4000"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": { description: "API is healthy" }
          }
        }
      },
      "/auth/register": {
        post: {
          summary: "Register user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    role: { type: "string", enum: ["ADMIN", "USER"] }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "User registered" }
          }
        }
      },
      "/auth/login": {
        post: {
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Login successful" },
            "401": { description: "Invalid credentials" },
            "429": { description: "Too many attempts" }
          }
        }
      },
      "/auth/me": {
        get: {
          summary: "Get current user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user" }
          }
        }
      },
      "/customers": {
        post: {
          summary: "Create customer",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Customer created" } }
        },
        get: {
          summary: "List/search customers",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "query", name: "search", schema: { type: "string" } }],
          responses: { "200": { description: "Customers" } }
        }
      },
      "/customers/{id}": {
        get: {
          summary: "Get customer details",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Customer" } }
        }
      },
      "/customers/{id}/kyc/submit": {
        post: {
          summary: "Submit KYC",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "KYC submitted" } }
        }
      },
      "/customers/{id}/kyc/approve": {
        post: {
          summary: "Approve KYC",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "KYC approved" } }
        }
      },
      "/customers/{id}/kyc/reject": {
        post: {
          summary: "Reject KYC",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "KYC rejected" } }
        }
      },
      "/customers/{id}/subscriptions": {
        post: {
          summary: "Create subscription for customer from plan",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "201": { description: "Subscription created" } }
        },
        get: {
          summary: "List customer subscriptions",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Subscriptions" } }
        }
      },
      "/subscriptions/{id}/cancel": {
        post: {
          summary: "Cancel subscription (admin or owning user)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Subscription canceled" } }
        }
      },
      "/subscriptions/{id}/start": {
        post: {
          summary: "Start or restart subscription (admin or owning user)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Subscription moved to inactive/pending payment" } }
        }
      },
      "/subscription-plans": {
        get: {
          summary: "List subscription plans",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Subscription plans" } }
        },
        post: {
          summary: "Create subscription plan",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Subscription plan created" } }
        }
      },
      "/subscription-plans/{id}": {
        put: {
          summary: "Update subscription plan",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Subscription plan updated" } }
        },
        delete: {
          summary: "Delete subscription plan",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "Subscription plan deleted" } }
        }
      },
      "/webhooks/payments": {
        post: {
          summary: "Payment provider webhook",
          parameters: [{ in: "header", name: "x-webhook-signature", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Webhook processed" }, "401": { description: "Invalid signature" } }
        }
      },
      "/webhooks/events": {
        get: {
          summary: "List webhook events",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Webhook events" } }
        }
      },
      "/audit-logs": {
        get: {
          summary: "List audit logs",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "customerId", schema: { type: "string" } },
            { in: "query", name: "action", schema: { type: "string" } }
          ],
          responses: { "200": { description: "Audit logs" } }
        }
      }
    }
  },
  apis: []
});
