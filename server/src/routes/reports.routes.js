import express  from "express";
import { User,Activity,Deal,Tenant } from "../models/index.js";
import { authenticate,requireMinRole,requirePro } from "../middleware/auth.middleware.js";


//reports 

const reports=express.Router()
reports(authenticate,requirePro)
//  /api/reports/pipeline   -deal value by stage 
reports.get('/pipeline',async(req,res,next)=>{
    try{
        const data=await Deal.aggregate([
            {$match:{tenantId:req.tenantId}},
            {$group:{_id:'$stage',count:{$sum:1},value:{$sum:'$value'}}},
            {$sort:{_id:1}}
        ])
        res.json(data)
    }catch(err){
        next(err)
    }
})

//      /api/reports/contants-over-time
reports.get('/contacts-over-time',async(req,res,next)=>{
    try{
        const data = await Contact.aggregate([
              { $match: { tenantId: req.tenantId } },
              { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 }
              }},
              { $sort: { '_id.year': 1, '_id.month': 1 } },
              { $limit: 12 }
            ])
        res.json(data)
    }catch(err){
        next(err)
    }
})

//      /api/reports/summary   -dashboard KPIs (no Pro gate)
const summary=express.Router()
summary.use(authenticate)

summary.get('/',async(req,res,next)=>{
    try{
        const tid = req.tenantId
        const [contacts, deals, wonDeals, recentActivity] = await Promise.all([
            Contact.countDocuments({ tenantId: tid }),
            Deal.countDocuments({ tenantId: tid }),
            Deal.aggregate([{ $match: { tenantId: tid, stage: 'Won' } }, { $group: { _id: null, total: { $sum: '$value' } } }]),
            Activity.find({ tenantId: tid }).populate('userId', 'name').sort({ createdAt: -1 }).limit(10)
        ])
        res.json({
            totalContacts: contacts,
            totalDeals: deals,
            wonRevenue: wonDeals[0]?.total ?? 0,
            recentActivity
        })
    }catch(err){
        next(err)
    }
})



//settings 

const settings =express.Router()
settings.use(authenticate)

settings.get('/',async(req,res)=>res.json(req.tenant))
//       /api/settings (admin+)
settings.patch('/',requireMinRole('admin'),async(req,res,next)=>{
    try {
        const { name, pipelineStages } = req.body
        const update = {}
        if (name) update.name = name
        if (pipelineStages && Array.isArray(pipelineStages)) update.pipelineStages = pipelineStages
    
        const tenant = await Tenant.findByIdAndUpdate(req.tenantId, update, { new: true })
        res.json(tenant)
    } catch (err) { next(err) }
})

//        /api/settings/profile — update own user
settings.patch('/profile', async (req, res, next) => {
  try {
    const { name, avatar } = req.body
    const user = req.user
    if (name) user.name = name
    if (avatar) user.avatar = avatar
    await user.save()
    res.json({ name: user.name, avatar: user.avatar })
  } catch (err) { next(err) }
})

export{reports as reportRoutes,summary as summaryRoutes, settings as settingsRoutes}