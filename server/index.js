import dotenv from 'dotenv'
import App from './App.js';
dotenv.config()
try{
    App.listen(process.env.PORT || 4000,()=>{
        console.log("server is running  on the PORT")
    })
}catch(err){
    console.log(err);
}
