//import dependencies
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

//import router
import authRouter from "./routes/auth.js";
import forecastRouter from "./routes/forecast.js";

const app = express();
const PORT = 8080;
const allowedOrigins = ['http://localhost:3000', 'http://localhost:8080'];

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.1.0",
        info: {
            title: 'Agritrack API Library',
            version: '1.0.0'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Authorization using a Bearer token in the format "Bearer <token>"'
                }
            }
        },
        security: {
            bearerAuth: []
        }
    },
    apis: ['routes/auth.js', 'routes/forecast.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(
    session({
        key: "userid",
        secret: "some secret key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60 * 60 * 408
        }
    })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/forecast', forecastRouter);

app.listen(PORT, () => {
    console.log(`Server started on port: http://localhost:${PORT}`);
});