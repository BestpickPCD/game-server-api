// @ts-nocheck
import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.ts';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import userSwagger from './swagger/index.ts';
dotenv.config();
const app = express();
const port = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  swaggerDefinition: {
    openapi: '3.0.1', // YOU NEED THIS
    info: {
      title: 'Your API title',
      version: '1.0.0',
      description: 'Your API description'
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
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    `/Users/truongphuocnguyen/Documents/web-project/game-server-backend/src/routes/user.ts`
  ]
};

const swaggerSpec = swaggerJSDoc(userSwagger, options);

app.use(cors());
app.use(express.json());
app.use('/', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
