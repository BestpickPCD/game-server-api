import userJson from './user.ts';
import currencyJson from './currency.ts';
import transactionJson from './transaction.ts';
import agentJson from './agent.ts';
export default {
  swaggerDefinition: {
    openapi: '3.0.1', // YOU NEED THIS
    info: {
      title: 'Game Server APIS',
      version: '1.0.0',
      description: 'Game Server APIS'
    },
    basePath: '/',
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header', // Specify where the bearer token will be passed (e.g., 'header', 'query', etc.)
          name: 'Authorization' // Specify the name of the header or query parameter carrying the bearer token
        }
      }
    },
    paths: {
      ...userJson,
      ...currencyJson,
      ...transactionJson,
      ...agentJson
    },
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization'
      }
    }
  },
  apis: []
};