import crypto from "crypto"
import OAuth from "oauth-1.0a";
import node from "node-fetch"
import dotenv from "dotenv";
import {TwitterApi} from 'twitter-api-v2' 
dotenv.config()


const API_KEY = process.env.API_KEY!;
const API_SECRET = process.env.API_SECRET!;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

const client= new TwitterApi({
    appKey: API_KEY,
    appSecret: API_SECRET,
    accessToken: ACCESS_TOKEN,
    accessSecret: ACCESS_TOKEN_SECRET,
})

const rwcclient= client.readWrite;

// const oauth= new OAuth({
//     consumer:{
//         key: API_KEY,
//         secret: API_SECRET,
//     },
//     signature_method: "HMAC-SHA1",
//     hash_function(base_string, key){
//         return crypto.createHmac("sha1", key).update(base_string).digest("base64")
//     }
// })

// const token={
//     key: ACCESS_TOKEN,
//     secret: ACCESS_TOKEN_SECRET
// }

export const postTweet= async(message: string)=>{
    // const url = "https://api.twitter.com/1.1/statuses/update.json"
    // const body = { status: message };
    // console.log("Preparing to send tweet:", body);

    try {
        // const res = await fetch(url, {
        //     method: "POST",
        //     headers: {
        //       ...oauth.toHeader(oauth.authorize({ url, method: "POST" }, token)),
        //       "Content-Type": "application/x-www-form-urlencoded",
        //     },
        //     body: new URLSearchParams(body).toString(),
        //   });

        // const data= await res.json()
        // console.log("Response from X:", data);

        // if(res.ok){
        //     console.log("Posted to x successfully", data)
        // }else{
        //     console.log("An error has occured", data)
        // } 


        const {data}= await rwcclient.v2.tweet(message)
        console.log("Posted to X", data)

    } catch (error) {
        console.log("Error occured while posting", error)  
    }

}

