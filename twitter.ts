import crypto from "crypto"
import OAuth from "oauth-1.0a";
import node from "node-fetch"
import dotenv from "dotenv";

dotenv.config()


const API_KEY = process.env.API_KEY!;
const API_SECRET = process.env.API_SECRET!;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

const oauth= new OAuth({
    consumer:{
        key: API_KEY,
        secret: API_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(base_string, key){
        return crypto.createHmac("sha1", key).update(base_string).digest("base64")
    }
})

const token={
    key: ACCESS_TOKEN,
    secret: ACCESS_TOKEN_SECRET
}

export const postTweet= async(message: string)=>{
    const url = "https://api.twitter.com/2/tweets"
    const body= {'text': message}

    const requestData={
        url,
        method: "POST"
    }

    const authHeader=oauth.toHeader(oauth.authorize(requestData, token))
    try {
        const res= await fetch(url, {
            method: "POST",
            headers:{
                ...authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })

        const data= await res.json()

        if(res.ok){
            console.log("Posted to x successfully", data)
        }else{
            console.log("An error has occured", data)
        } 
    } catch (error) {
        console.log("Error occured while posting", error)  
    }

}

