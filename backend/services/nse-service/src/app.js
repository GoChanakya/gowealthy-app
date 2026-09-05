import express from "express";
import morgan from "morgan";
import { activityLog } from "./middleware/activityLog.js";
import { cors } from "./middleware/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { router } from "./routes/index.js";

/** Builds the Express app. Kept separate from listen() so it can be tested. */
export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(morgan("dev"));
    app.use(activityLog);
    app.use(cors);

    app.use(router);

    app.use(errorHandler);
    return app;
}
