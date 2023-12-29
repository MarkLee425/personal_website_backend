// Import packages
import express from "express";
import NodeCache from "node-cache";
import { v4 } from "uuid";
import cors from "cors";
import { Resend } from "resend";
import { Request, Response } from "express";

require("dotenv").config();
// Middlewares
const app = express();
app.use(express.json());
const cache = new NodeCache();
const port = process.env.PORT || 8001;

cache.set("accessToken", v4());

setInterval(() => {
  cache.set("accessToken", v4());
}, 1000 * 60 * 60);

var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes

app.get("/api/getAccessToken", (req: Request, res: Response) => {
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

app.post("/api/send-email", async (req, res) => {
  const accessToken = req.header("Authorization");
  if (!accessToken)
    return res.status(401).json({
      error: "Unauthorized. Access token is required in the header.",
    });

  if (cache.get("accessToken") !== accessToken) {
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
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`Listening to port ${port}`));
