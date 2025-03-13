import { app } from "./app.js";
import { connectDB } from "./db/connectDB.js";
import dotenv from "dotenv"
dotenv.config();

const port = process.env.PORT || 8080 ;

async function Host() {
    try{
        await connectDB()
        app.listen(port , (req,res)=>{
            console.log(`Listening on the port ${port}`)
        })
    }catch(error){
        console.log(`Error while hosting the server , Error : ${error}`)
    }
}

Host()