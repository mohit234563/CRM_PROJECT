import dotenv from 'dotenv';
import express from 'express';
dotenv.config();
const App=express();
App.use(express.json());
App.get('/',(req,res)=>{
    return res.status(200).json("hello mohit");
})
export default App;