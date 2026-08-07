import express from 'express'
import {Contact,Activity} from '../models/index.js'
import {authenticate,requireMinRole} from '../middleware/auth.middleware.js'
import { io } from '../../App.js'
const router=express.Router();
router.use(authenticate);

//Get /api/contacts

router.get('/',async(req,res,next)=>{
    try{
        const {search,tag,status,assignedTo,page=1,limit=10}=req.query
        const filter={tenantId:req.tenantId}

        if(search)filter.$text={$search:search}
        if(tag)filter.tags=tag
        if(status)filter.status=status
        if(assignedTo)filter.assignedTo=assignedTo

        if(req.user.role==='member')filter.assignedTo=req.user._id
        const [contacts, total] = await Promise.all([
              Contact.find(filter)
                .populate('assignedTo', 'name email avatar')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit)),
              Contact.countDocuments(filter)
            ])
        res.json({ contacts, total, pages: Math.ceil(total / limit) })
    }catch(err){
        next(err)
    }
})

//get contact by id
router.get('/:id',async(req,res,next)=>{
    try{
        const contact=await Contact.findOne({_id:req.params.id,tenantId:req.tenantId}).populate('assignedTo', 'name email avatar')
        if(!contact)return res.status(404).json({error:"contact not found"})
            return res.status(200).json(contact)
    }catch(err){
        next(err)
    }
})


// POST /api/contacts
router.post('/', async (req, res, next) => {
  try {
    const contact = await Contact.create({ ...req.body, tenantId: req.tenantId })
    await log(req, 'contact', contact._id, 'created', { name: contact.name })
    io.to(`tenant:${req.tenantId}`).emit('contact:created', contact)
    res.status(201).json(contact)
  } catch (err) { next(err) }
})

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body, { new: true, runValidators: true }
    ).populate('assignedTo', 'name email avatar')
    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    io.to(`tenant:${req.tenantId}`).emit('contact:updated', contact)
    res.json(contact)
  } catch (err) { next(err) }
})

// DELETE /api/contacts/:id (admin+)
router.delete('/:id', requireMinRole('admin'), async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId })
    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    await log(req, 'contact', contact._id, 'deleted', { name: contact.name })
    io.to(`tenant:${req.tenantId}`).emit('contact:deleted', { _id: contact._id })
    res.json({ message: 'Contact deleted' })
  } catch (err) { next(err) }
})

const log = (req, type, id, action, meta) =>
  Activity.create({ tenantId: req.tenantId, userId: req.user._id, entityType: type, entityId: id, action, meta })

export default router
