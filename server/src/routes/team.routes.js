import express from 'express'
import {User,Invite} from '../models/index.js'
import { authenticate,requireMinRole } from '../middleware/auth.middleware.js'

const router=express.Router()
router.use(authenticate)

//  /api/team
router.get('/',async(req,res,next)=>{
    try{
        const members=await User.find({tenantId:req.tenantId,isActive:true}).select('-password')
        const invites=await Invite.find({tenantId:req.tenantId,accepted:false})
        res.json({members,invites})
        
    }catch(err){
        next(err)
    }
})

//    /api/team/:id/role(admin+,can't change owner)
router.patch('/:id/role',requireMinRole('admin'),async(req,res,next)=>{
    try{
        const {role}=req.body
        if(!['admin','member'].includes(role))
            return res.status(400).json({error:'invailid role'})

        const target=await User.findOne({_id:req.params.id,tenantId:req.tenantId})
        if(!target){
            return res.status(404).json({error:'user not found'})
        }
        if(target.role=='owner')return res.status(403).json({error:'Cannot change owner role'})
        target.role=role
        await target.save()
        res.json(target)
    }catch(err){
        next(err)
    }
})

//    /api/team/:id  -remove member (admin+)
router.delete('/:id', requireMinRole('admin'), async (req, res, next) => {
  try {
    const target = await User.findOne({ _id: req.params.id, tenantId: req.tenantId })
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.role === 'owner') return res.status(403).json({ error: 'Cannot remove owner' })
    if (target._id.equals(req.user._id)) return res.status(400).json({ error: 'Cannot remove yourself' })

    target.isActive = false
    await target.save()
    res.json({ message: 'Member removed' })
  } catch (err) { next(err) }
})

//   /api/team/invite/:id  -cancel pending invites
router.delete('/invite/:id', requireMinRole('admin'), async (req, res, next) => {
  try {
    await Invite.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId })
    res.json({ message: 'Invite cancelled' })
  } catch (err) { next(err) }
})

export default router