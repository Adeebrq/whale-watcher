import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import fs from "fs";
import { extractBuys } from "./functions";
import {postTweet} from "./twitter"

app.use(express.json());
app.use(cors());

let data: any = null;
let buyHistory: any = null;

const formatAmount=(num: number | null)=>{
  if(num === null) return "N/A";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2)+ "M"
  if(num >= 1_000) return (num / 1_000).toFixed(1)+ 'K'
    return num.toString()
}

try {

    if (!fs.existsSync("webhookJson.json",)) {
        fs.writeFileSync("webhookJson.json", "[]"); // Create empty array
      }
      if (!fs.existsSync("buys.json")) {
        fs.writeFileSync("buys.json", "[]");
      }

  const datafetch = fs.readFileSync("webhookJson.json", "utf-8");
  data = JSON.parse(datafetch);

  const buyDataFetch = fs.readFileSync("buys.json", "utf-8");
  buyHistory = JSON.parse(buyDataFetch);
} catch (error) {
  console.log("error occured", error);
}

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
  const buyData = await extractBuys(event);
  existingBuys.push(...buyData);
  fs.writeFileSync("buys.json", JSON.stringify(existingBuys, null, 2));
  buyHistory = existingBuys; // to update GET /buys

  // Posting to x
  for (const buy of buyData){
    const message = `A [\$${buy.tokenSymbol}](https://x.com/search?q=%24${buy.tokenSymbol}&src=cashtag_click) whale just bought \$${formatAmount(buy.usdBalance)} of [\$${buy.tokenSymbol}](https://x.com/search?q=%24${buy.tokenSymbol}&src=cashtag_click) at \$${formatAmount(buy.mrktCap)} MC! 🐳\n\nCA - ${buy.mint}`;
    console.log("Posting to X")
    await postTweet(message)
  }

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