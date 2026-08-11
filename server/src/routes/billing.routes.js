import express from 'express'
import Stripe  from 'stripe'
import { Tenant } from '../models/index.js'
import { authenticate,requireRole } from '../middleware/auth.middleware.js'

const router =express.Router()
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY)

//        /api/billing/create-checkout (owner only)
router.post('/create-checkout', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    let customerId = req.tenant.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email, name: req.tenant.name,
        metadata: { tenantId: req.tenantId.toString() }
      })
      customerId = customer.id
      await Tenant.findByIdAndUpdate(req.tenantId, { stripeCustomerId: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/settings/billing?success=true`,
      cancel_url:  `${process.env.CLIENT_URL}/settings/billing`,
      metadata:    { tenantId: req.tenantId.toString() }
    })

    res.json({ url: session.url })
  } catch (err) { next(err) }
})

//    /api/billing/portal — Stripe customer portal
router.post('/portal', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    if (!req.tenant.stripeCustomerId)
      return res.status(400).json({ error: 'No billing account found' })

    const session = await stripe.billingPortal.sessions.create({
      customer:   req.tenant.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/settings/billing`
    })
    res.json({ url: session.url })
  } catch (err) { next(err) }
})

//      /api/billing/status
router.get('/status', authenticate, async (req, res) => {
  const { plan, subscriptionStatus, trialEndsAt, stripeCustomerId } = req.tenant
  const inTrial = subscriptionStatus === 'trialing' && new Date() < new Date(trialEndsAt)
  res.json({ plan, subscriptionStatus, trialEndsAt, inTrial, hasStripe: !!stripeCustomerId })
})

// POST /api/billing/webhook — Stripe events (raw body)
router.post('/webhook', async (req, res) => {
  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    return res.status(400).send('Webhook signature verification failed')
  }

  const data = event.data.object

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await Tenant.findOneAndUpdate(
          { stripeCustomerId: data.customer },
          { plan: 'pro', subscriptionStatus: data.status, stripeSubscriptionId: data.id }
        )
        break
      }
      case 'customer.subscription.deleted': {
        await Tenant.findOneAndUpdate(
          { stripeCustomerId: data.customer },
          { plan: 'free', subscriptionStatus: 'canceled', stripeSubscriptionId: null }
        )
        break
      }
      case 'invoice.payment_failed': {
        await Tenant.findOneAndUpdate(
          { stripeCustomerId: data.customer },
          { subscriptionStatus: 'past_due' }
        )
        break
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router
