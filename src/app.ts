import express, { Application } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoose from "mongoose";
import config from "config";
import errorMiddleware from "@/middleware/error.middleware";
import loggerMiddleware from "@/middleware/logger.middleware";
import Controller from "@/utils/interfaces/controller.interface";
import { AppOptions } from "@/utils/interfaces/app.interface";
import options from "./utils/swagger";

class App {
    private readonly express: Application = express();
    private readonly controllers: Controller[];
    private readonly port: number;
    private readonly logger: any | undefined;
    private readonly apiRoot: string;

    constructor({ controllers, port, logger, apiRoot }: AppOptions) {
        this.controllers = controllers;
        this.port = port;
        this.logger = logger;
        this.apiRoot = apiRoot || "/";

        this.logger?.info(`Running in ${process.env.NODE_ENV} mode`);

        this.initializeMiddleware();
        this.initializeControllers();
        this.initializeErrorHandling();
    }

    private initializeMiddleware(): void {
        this.express.use(helmet());
        this.express.use(loggerMiddleware);
        this.express.use(
            cors({
                origin: (origin, callback) => {
                    if (!origin) {
                        return callback(null, true);
                    }

                    const origins = config.get<string[]>("cors.origins");
                    const isAllowed = origin in origins;

                    if (isAllowed) {
                        return callback(null, true);
                    }

                    return callback(new Error("Not allowed by CORS"));
                },
            }),
        );
        this.express.use(express.json());
        this.express.use(cookieParser());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(compression());
        this.express.use(this.apiRoot, express.static(path.join(__dirname, "./public")));
    }

    private initializeControllers(): void {
        for (const controller of this.controllers) {
            this.logger?.info(`Registering resource: ${controller.path}`);
            this.express.use(this.apiRoot, controller.router);
        }
    }

    private onAppDidStart() {
        const url = `http://localhost:${this.port}${this.apiRoot}`;
        this.logger?.info(`App is running at ${url}`);

        for (const controller of this.controllers) {
            if (!controller.onAppDidStart) {
                continue;
            }

            controller.onAppDidStart({ url });
        }
    }

    private initializeErrorHandling(): void {
        this.express.use(errorMiddleware);
    }

    private initializeDatabaseConnection(): void {
        mongoose.connect(config.get<string>("db.uri"));

        mongoose.connection.once("open", () => {
            this.logger?.info("Connected to MongoDB");

            this.express.listen(this.port, () => {
                this.onAppDidStart();
            });
        });

        mongoose.connection.on("error", (err) => {
            this.logger?.error(err, "MongoDB connection error");
        });
    }

    public start(): void {
        this.initializeDatabaseConnection();
    }
}

export default App;
