import express, { Request, Response } from "express";
import NodeCache = require("node-cache");
import { v4 as uuidv4 } from "uuid";
import cors = require("cors");
import e = require("cors");
import router from "./routes/api";

require("dotenv").config();

const app = express();
export const cache = new NodeCache();
const port = process.env.PORT || 8000;

cache.set("accessToken", uuidv4());

setInterval(
  () => {
    cache.set("accessToken", uuidv4());
  },
  1000 * 60 * 60
);

var corsOptions: e.CorsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", router);

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
