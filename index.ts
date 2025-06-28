import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import fs from "fs";

app.use(express.json());
app.use(cors());

let data: any = null;
try {
  const datafetch = fs.readFileSync("webhookJson.json", "utf-8");
  data = JSON.parse(datafetch);
  console.log("Fetched data ");
} catch (error) {
  console.log("error occured", error);
}

app.get("/api", (req: Request, res: Response) => {
  console.log("Server up!");
  res.status(200).json("server is up");
});

app.post("/solana-webhook", (req: Request, res: Response) => {
  const event = req.body;
  data = event;
  let existingData: any[] = [];
  try {
    const dataFile = fs.readFileSync("webhookJson.json", "utf-8");
    existingData = JSON.parse(dataFile);
    if (!Array.isArray(existingData)) {
      existingData = [];
    }
  } catch (error) {
    existingData = [];
  }
  existingData.push(event);
  fs.writeFileSync("webhookJson.json", JSON.stringify(existingData, null, 2));

  console.log("Webhook data posted- ", event);
  console.log("Entire data- ", existingData)
  res.status(200).json({ message: event });
});

app.get("/webhook", (req: Request, res: Response) => {
  if (data === null) {
    res.status(404).json("No data is available in webhook");
  } else {
    try {
      const datafetch = fs.readFileSync("webhookJson.json", "utf-8");
      const datafetched = JSON.parse(datafetch);
      res.status(200).json(datafetched);
    } catch (error) {
      res.status(400).json(error);
    }
  }
});
app.listen(3030, () => console.log("server started on port 3030"));
