import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import {Invite, Tenant,User} from '../models/index.js'
import { signToken } from '../middleware/auth.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendInviteEmail, sendWelcomeEmail } from '../services/email.js';
const router=express.Router();




const cookieOptions = () => ({
    httpOnly: true,
    // sameSite:"none" is required for cookies to be set when frontend and
    // backend are on different domains (e.g. Vercel + Render) — this REQUIRES
    // secure:true, which in turn requires the site to be served over HTTPS.
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches refresh token expiry
});

//register company with its owner
router.post("/register",async(req,res,next)=>{
    try
    {
        const {companyName,name,password,email}=req.body
        //first check all the credentials
        if(!(companyName && name && password && email))
            return res.status(400).json({error:"All fields are required"})
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()

        // Calculate a date 14 days from right now
        const trialDate = new Date();
        trialDate.setDate(trialDate.getDate() + 14);

        // Add trialEndsAt to your tenant creation!
        const tenant = await Tenant.create({
            name: companyName, 
            slug: slug,
            trialEndsAt: trialDate // Make sure this matches your Tenant schema field name!
        })

        const user=await User.create({tenantId:tenant._id,name:name,email:email,password:password,role:"owner"})

        //send a welcome mail
        await sendWelcomeEmail(email,name,companyName)

        const token=signToken(user._id,tenant._id)
        return res.status(200).json({token,user:sanitize(user),tenant})
    }catch(err){
        console.log(err)
        next(err)
    }
})

router.post("/login",async(req,res,next)=>{
    try{
        const {email,password}=req.body
        if(!(email && password))return res.status(400).json({error:"email and password both are required"})
        
        const user=await User.findOne({email:email.toLowerCase()}).select('+password')
        if (!user)return res.status(401).json({error:"invalid credentials"})
        const valid=await user.comparePassword(password)
        if(!valid)return res.status(401).json({error:"Invalid credentials"})
        if(!user.isActive)return res.status(401).json({error:"user is deactivate currently"})
        
        const token =signToken(user._id,user.tenantId)
        const tenant=await Tenant.findById(user.tenantId)

        res.status(201).cookie("token", token, cookieOptions())
        .json({ token, user: sanitize(user), tenant })
    } catch (err) { next(err) }
    
})

//get current user
router.get('/me', authenticate, async(req, res) => {
    // Only sanitize the user, pass the tenant exactly as it is
    res.json({ user: sanitize(req.user), tenant: req.tenant })
})

// send invite to the team(not exists in user schema)
router.post('/send-invite',authenticate,async(req,res,next)=>{
    try{
        const {email,role='member'}=req.body
        if(!['member','admin'].includes(role))
            return res.status(400).json({error:"invalid role"})

        const existing=await User.findOne({tenantId:req.tenantId,email:email.toLowerCase()})
        if(existing)
            return res.status(400).json({error:"user already exists!"})
        const token=crypto.randomBytes(32).toString('hex')
        await Invite.findOneAndUpdate(
            { tenantId: req.tenantId, email: email.toLowerCase() },
            { token, role, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), accepted: false },
            { upsert: true }
        )
        //send the mail to user for request
        await sendInviteEmail(email,req.tenant.name,req.user.name,token)
        res.json({ message: 'Invite sent' })
    }catch (err) { next(err) }
})

//for the request 
router.post('/accept-invite',async(req,res,next)=>{
    try{
        //token is assigned ot the user while sending the invite
        //name of the user,
        const {token,name,password}=req.body
        const invite=await Invite.findOne({token:token,accepted:false})
        if(!invite)return res.status(400).json({error:"invalid or expired invite"})
        if(new Date()>invite.expiresAt)return res.status(400).json({error:"expired token"})

        const user=await User.create({
            tenantId:invite.tenantId,email:invite.email,
            role:invite.role,password,name
        })
        //update the request status
        await Invite.findByIdAndUpdate(invite._id, { accepted: true })

        const tenant=await Tenant.findById(invite.tenantId)
        const authToken=signToken(user._id,invite.tenantId)
        res.status(201).json({token:authToken,user:sanitize(user),tenant})
    }catch(err){
        next(err)
    }
})
export default router;
const sanitize = u => ({
  _id: u._id, name: u.name, email: u.email,
  role: u.role, avatar: u.avatar, tenantId: u.tenantId
})