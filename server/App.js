import http from 'http'
import {Server} from 'socket.io'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'
import {connectDB} from './src/db/index.js'
import { errorHandler } from '../../src/middleware/errorHandler.js';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.js'
import contactRoutes from './src/routes/contacts.routes.js'
import dealRoutes from './src/routes/deal.routes.js'
import teamRoutes from './src/routes/team.routes.js'
import billingRoutes from './src/routes/billing.routes.js'
import {reportRoutes,summaryRoutes} from './src/routes/reports.routes.js'
import { settingsRoutes } from './src/routes/settings.routes.js';

dotenv.config();

const App=express();
const server=http.createServer(App)
export const io=new Server(server,{
    cors:{origin:process.env.CLIENT_URL,methods:['GET','POST']}
})
//DB
connectDB()
//middleware
App.use(helmet)
App.use(cors({origin:process.env.CLIENT_URL,credentials:true}))
App.use(morgan('dev'))
//strip webhook needs raw body before express.json()
App.use('/api/billing/webhook',express.raw({type:'application/json'}))
App.use(express.json());
App.use(cookieParser())


//Routes
App.use('/api/auth', authRoutes)
App.use('/api/contacts',contactRoutes)
App.use('/api/deals',dealRoutes)
App.use('/api/team',teamRoutes)
App.use('/api/billing',billingRoutes)
App.use('/api/reports',reportRoutes)
App.use('/api/reports',summaryRoutes)
App.use('/api/settings',settingsRoutes)
App.get('/api/health',(_,res)=>{
    return res.status(200).json("server is running well");
})

//Socket.io-join tenant room fro real-time updates
io.on('connection',socket=>{
    socket.on('join-tenant',tenantId=>{
        socket.join(`tenant:${tenantId}`)
    })
    socket.on('disconnected',()=>{})
})
App.use(errorHandler)
export default App;