const express= require("express")

const app= express()

app.use(express.json())

app.get("/api", (req : any, res: any)=>{
    console.log("Server up!")
    res.status(200).json("server is up")

})

app.listen(3030, ()=> console.log("server started on port 3030"))