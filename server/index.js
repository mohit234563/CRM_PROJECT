import dotenv from 'dotenv'
import { server } from './App.js';
dotenv.config()
try{
    server.listen(process.env.PORT || 4000, ()=>{
        console.log(`server is running on http://localhost:${process.env.PORT || 4000}`)
    })
}catch(err){
    console.log(err);
}
