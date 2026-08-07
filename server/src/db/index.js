import mongoose from 'mongoose'

export const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    }catch(err){
        console.error("something went wrong while connecting to database",err.message)
        process.exit(1)
    }
}