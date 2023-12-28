import express, { Request, Response } from "express";
import { Resend } from "resend";
import NodeCache = require("node-cache");
import { v4 as uuidv4 } from "uuid";
import cors = require("cors");
import bodyParser from "body-parser";

require("dotenv").config();

const app = express();
const cache = new NodeCache();
const port = process.env.PORT || 8000;

cache.set("accessToken", uuidv4());

setInterval(() => {
  cache.set("accessToken", uuidv4());
}, 1000 * 60 * 60);

var corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get("/", (_req, res: Response) => {
  return res.status(404).send("Forbidden Request");
});

app.get("/api/getAccessToken", (_req: Request, res: Response) => {
  if (!cache.get("accessToken"))
    res.status(500).json({
      error: "Internal Server Error!",
    });
  res.status(200).json({
    accessToken: cache.get("accessToken"),
  });
});

app.post("/api/send-email", async (req, res: Response) => {
  const accessToken = req.header("Authorization");
  if (!accessToken)
    return res.status(401).json({
      error: "Unauthorized. Access token is required in the header.",
    });

  if ((cache.get("accessToken") as string) !== (accessToken as string)) {
    return res.status(401).json({
      error: "Unauthorized. Invalid access token.",
    });
  }
  const { from, subject, html } = req.body;
  console.log(from, subject, html);
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "update@career.resend.com",
      to: "leehokwong0425@protonmail.com",
      subject,
      html,
    });
    console.log(error?.message);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: "Success!", id: data?.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
