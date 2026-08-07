import http from 'http'
import {Server} from 'socket.io'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.js'
import contactRoutes from './src/routes/contacts.routes.js'
import {connectDB} from './src/db/index.js'
dotenv.config();

const App=express();
connectDB()
App.use(express.json());
App.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
App.use(cookieParser())
App.use('/api/auth', authRoutes)
App.use('./api/contacts',contactRoutes)
App.get('/api/health',(req,res)=>{
    return res.status(200).json("server is running well");
})
export default App;