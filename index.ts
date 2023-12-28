import express, { Request, Response } from "express";
import { Resend } from "resend";
import NodeCache = require("node-cache");
import { v4 as uuidv4 } from "uuid";
import cors = require("cors");
import bodyParser from "body-parser";
import e = require("cors");

require("dotenv").config();

const app = express();
const cache = new NodeCache();
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
app.use(bodyParser.json());

app.get("/", (_req: Request, res: Response) => {
  return res?.status(404).send("Forbidden Request");
});

app.get("/getAccessToken", (req: Request, res: Response) => {
  if (process.env.API_TOKEN !== req.header("Authorization"))
    return res.status(401).send("Unauthorized. API token is required.");
  if (!cache.get("accessToken"))
    return res.status(500).json({
      error: "Internal Server Error!",
    });
  return res.status(200).json({
    accessToken: cache.get("accessToken"),
  });
});

app.post("/send-email", async (req, res: Response) => {
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
  if (!from || !subject || !html)
    return res.status(400).json({
      error:
        "Bad Request. Please make sure you have include the 'from', 'subject' and 'html'.",
    });
  try {
    const record = cache.get(from);
    console.log("current record: " + from + "_" + record);
    console.log(parseInt(record as string) >= 2);
    if (record && parseInt(record as string) >= 2)
      return res
        .status(406)
        .json({ error: "Sorry you have exceeded the sending limit." });
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_REGISTERED_EMAIL ?? "",
      to: process.env.MY_EMAIL ?? "",
      subject,
      html,
    });
    if (error) return res.status(500).json({ error: error.message });
    cache.set(from, record ? parseInt(record as string) + 1 : 1, 86400);
    return res.status(200).json({ message: "Success!", id: data?.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
