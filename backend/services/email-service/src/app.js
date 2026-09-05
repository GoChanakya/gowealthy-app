import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { router } from "./routes/index.js";

export function createApp() {
    const app = express();

    app.use(cors({ origin: config.corsOrigins }));
    app.use(express.json());

    app.use(router);
    return app;
}
