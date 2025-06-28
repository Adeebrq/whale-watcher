import express, { Request, Response } from "express";
const app= express()
import cors from "cors";
import fs from "fs"

app.use(express.json())
app.use(cors())

let data: any = null

app.get("/api", (req : Request, res: Response)=>{
    console.log("Server up!")
    res.status(200).json("server is up")
})

app.post("/solana-webhook", (req: Request, res: Response)=>{
    const event= req.body
    data= event
    fs.writeFileSync("webhookJson.json", JSON.stringify(event))

    console.log("action", JSON.stringify(event, null , 2))
    res.status(200).json({"message": event})

})

app.get("/webhook", (req: Request, res: Response)=>{
    res.status(200).json(data)
    if(data === null){
        res.status(200).json("No data is available in webhook")
    }else{
        // res.status(200).json(data)
        const datafetch= fs.readFileSync("webhookJson.json", 'utf-8')
        const datafetched= JSON.parse(datafetch)
        res.status(200).json(datafetched)
    }
})
app.listen(3030, ()=> console.log("server started on port 3030"))