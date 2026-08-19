import jwt from 'jsonwebtoken'
import {User ,Tenant} from '../models/index.js'
export const authenticate=async(req,res,next)=>{
    try{
        const token =
        req.cookies?.token ||
        req.headers["authorization"]?.replace("Bearer ", "");
        if(!token)return res.status(401).json({error:"no token provided"})
        
        const payload=jwt.verify(token,process.env.JWT_SECRET)
        const user=await User.findById(payload.userId).select('-password')
        if(!(user && user.isActive))
            return res.status(401).json({error:"user not found or inactive"})

        const tenant=await Tenant.findById(payload.tenantId)
        if(!tenant)
          return res.status(401).json({error:"tenant not found"})
        req.user=user
        req.tenant=tenant
        req.tenantId=tenant._id
        next()
    }catch(err){
        console.log(err)
        res.status(401).json({error:"invalid or expired token"})
    }
}

// Role-based access control
const ROLE_HIERARCHY = { owner: 3, admin: 2, member: 1 }

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  next()
}

export const requireMinRole = (minRole) => (req, res, next) => {
  if (ROLE_HIERARCHY[req.user.role] < ROLE_HIERARCHY[minRole]) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  next()
}

// Gate features behind Pro plan
export const requirePro = (req, res, next) => {
  const { plan, subscriptionStatus, subscriptionEndAt } = req.tenant
  const inTrial = subscriptionStatus === 'trialing' && new Date() < new Date(subscriptionEndAt)
  if (plan === 'pro' || inTrial) return next()
  res.status(402).json({ error: 'This feature requires a Pro plan', upgrade: true })
}

export const signToken=(userId,tenantId)=>
    jwt.sign({userId,tenantId},process.env.JWT_SECRET,{expiresIn:'7d'})
