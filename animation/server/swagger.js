import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Task Management API',
    description: 'Automatically generated API documentation',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token in the format **Bearer &lt;token&gt;**'
    }
  }
};

const outputFile = './swagger-output.json';
const routes = ['./server.js']; 

swaggerAutogen()(outputFile, routes, doc);