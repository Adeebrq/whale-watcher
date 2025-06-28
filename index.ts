import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import fs from "fs";
import { extractBuys } from "./functions";

app.use(express.json());
app.use(cors());

let data: any = null;
let buyHistory: any = null;

try {
  const datafetch = fs.readFileSync("webhookJson.json", "utf-8");
  data = JSON.parse(datafetch);
  console.log("Fetched data");

  const buyDataFetch = fs.readFileSync("buys.json", "utf-8");
  buyHistory = JSON.parse(buyDataFetch);
  console.log("Buy data fetched");
} catch (error) {
  console.log("error occured", error);
}

app.get("/api", (req: Request, res: Response) => {
  console.log("Server up!");
  res.status(200).json("server is up");
});

app.post("/solana-webhook", async (req: Request, res: Response) => {
  const event = req.body;
  data = event;
  let existingData: any[] = [];
  let existingBuys: any[] = [];

  try {
    const dataFile = fs.readFileSync("webhookJson.json", "utf-8");
    existingData = JSON.parse(dataFile);
    existingData= Array.isArray(existingData) ? existingData : []

    const buyDataFetch = fs.readFileSync("buys.json", "utf-8");
    buyHistory = JSON.parse(buyDataFetch);
    existingBuys = Array.isArray( buyHistory) ? buyHistory : []
  } catch (error) {
    existingData = [];
    existingBuys = [];
  }

  // push all data
  existingData.push(event);
  fs.writeFileSync("webhookJson.json", JSON.stringify(existingData, null, 2));

  //push buy data
  const buyData = await extractBuys([event]);
  console.log("Buy data extracted from event:", buyData);
  existingBuys.push(...buyData);
  fs.writeFileSync("buys.json", JSON.stringify(existingBuys, null, 2));
  buyHistory = existingBuys;

  console.log("Webhook data posted- ", event);
  console.log("Entire data- ", existingData);

  console.log("Entire buy data- ", existingBuys);

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

app.get("/buys", (req: Request, res: Response) => {
  if (buyHistory) {
    res.status(200).json(buyHistory);
  } else {
    res.status(404).json("Buyers data not found");
  }
});

app.listen(3030, () => console.log("server started on port 3030"));
