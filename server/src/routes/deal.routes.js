import express from 'express'
import io from '../../App.js'
import { Contact,Activity } from '../models/index.js'
import { authenticate,requireMinRole } from '../middleware/auth.middleware.js'

const router=express.Router()
router.use(authenticate)

//Get api/deal 
router.get('/',async(req,res,next)=>{
    const filter={tenantId:req.tenantId}
    if(req.user.role==='member')filter.assignedTo=req.user._id

    const deal=await Deal.findOne(filter)
    .populate('contactId','name email company')
    .populate('assignedTo','name email avatar')
    .sort({stage:1,order:1})
    
})
//Post api/deals
router.post('/', async (req, res, next) => {
  try {
    const count = await Deal.countDocuments({ tenantId: req.tenantId, stage: req.body.stage })
    const deal  = await Deal.create({ ...req.body, tenantId: req.tenantId, order: count })
    const pop   = await deal.populate(['contactId', 'assignedTo'])
    await log(req, deal._id, 'created', { title: deal.title })
    io.to(`tenant:${req.tenantId}`).emit('deal:created', pop)
    res.status(201).json(pop)
  } catch (err) { next(err) }
})

// PATCH /api/deals/:id/stage — move card between columns
router.patch('/:id/stage', async (req, res, next) => {
  try {
    const { stage, order } = req.body
    const deal = await Deal.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { stage, order }, { new: true }
    ).populate(['contactId', 'assignedTo'])
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    await log(req, deal._id, 'stage_changed', { stage })
    io.to(`tenant:${req.tenantId}`).emit('deal:updated', deal)
    res.json(deal)
  } catch (err) { next(err) }
})

// PATCH /api/deals/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const deal = await Deal.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body, { new: true, runValidators: true }
    ).populate(['contactId', 'assignedTo'])
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    io.to(`tenant:${req.tenantId}`).emit('deal:updated', deal)
    res.json(deal)
  } catch (err) { next(err) }
})

// DELETE /api/deals/:id (admin+)
router.delete('/:id', requireMinRole('admin'), async (req, res, next) => {
  try {
    const deal = await Deal.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId })
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    io.to(`tenant:${req.tenantId}`).emit('deal:deleted', { _id: deal._id })
    res.json({ message: 'Deal deleted' })
  } catch (err) { next(err) }
})

const log = (req, id, action, meta) =>
  Activity.create({ tenantId: req.tenantId, userId: req.user._id, entityType: 'deal', entityId: id, action, meta })

export default router
