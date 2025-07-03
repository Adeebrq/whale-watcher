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


export const postTweet= async(message: string)=>{
    try {
        const {data}= await rwcclient.v2.tweet(message)
        console.log("Posted to X", data)

    } catch (error) {
        console.log("Error occured while posting", error)  
    }

}

