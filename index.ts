import express, { Request, Response } from "express";
const app= express()
import cors from "cors";

app.use(express.json())
app.use(cors())

let data: any = null

app.get("/api", (req : any, res: any)=>{
    console.log("Server up!")
    res.status(200).json("server is up")
})

app.post("/solana-webhook", (req: Request, res: Response)=>{
    const event= req.body
    data= event
    console.log("action", JSON.stringify(event, null , 2))
    res.status(200).json({"message": event})

})

app.get("/webhook", (req: Request, res: Response)=>{
    res.status(200).json(data)
})
app.listen(3030, ()=> console.log("server started on port 3030"))