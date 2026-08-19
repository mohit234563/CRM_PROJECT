import mongoose from "mongoose";
import bcrypt from "bcrypt"
const { Schema, model } = mongoose

//tenant means the org. who avails the CRM services
const tenantSchema=new Schema({
    name:{type:String,required:true,trim:true},
    slug:{type:String,required:true,lowercase:true},
    logo:{type:String},
    plan:{type:String,enum:["free","pro"],default:"free"},
    subscriptionStatus:{type:String,enum:["active","inactive","canceled","trialing"],default:"trialing"},
    subscriptionEndAt:{type:Date,default:()=>new Date(Date.now()+14*24*60*60*1000)},
    stripeCustomerId:{type:String},
    stripeSubscriptionId:{type:String},
    pipelineStages:     { type: [String], default: ['Lead', 'Prospect', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
},{timestamps:true})

//users credentials who are using the CRM
const userSchema=new Schema({
    name:{type:String,required:true,trim:true},
    email:{type:String,required:true,trim:true,lowercase:true,unique:true},
    tenantId:{type:Schema.Types.ObjectId,ref:'Tenant',trim:true,index:true},
    role:{type:String,enum:["owner","admin","member"],default:"member"},
    password:{type:String,select:false},
    avatar:{type:String},
    isActive:{type:Boolean,default:true}
},{timestamps:true})

// indexing using tenant id and user email
userSchema.index({tenantId:1,email:1},{unique:true})
//hash password check before save into DB
userSchema.pre('save',async function (next) {
    if (!this.isModified('password')) return next
    this.password = await bcrypt.hash(this.password, 12)
    next
})

//check the password with the stored password
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

const contactSchema=new Schema({
    tenantId:{type:Schema.Types.ObjectId,ref:'Tenant',index:true,required:true},
    assignedTo:{type:Schema.Types.ObjectId,ref:'User'},
    name:{type:String,required:true,trim:true},
    email:{type:String,required:true,lowercase:true},
    phone:String,
    notes:String,
    tags:[String],
    avatar:String,
    status:{type:String,enum:["active","inactive"],default:"active"},
    position:String,
    company:String
},{timestamps:true})

//indexing types
contactSchema.index({tenantId:1,email:"text"})
contactSchema.index({tenantId:1,createdAt:-1})
contactSchema.index({tenantId:1,name:"text",email:"text",company:"text"})

const dealSchema = new Schema({
    tenantId: {type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true},
    
    // Change userId to contactId right here:
    contactId: {type: Schema.Types.ObjectId, ref: 'Contact'}, 
    
    assignedTo: {type: Schema.Types.ObjectId, ref: 'User'},
    notes: String,
    value: {type: Number, default: 0},
    title: {type: String, required: true, trim: true},
    priority: {type: String, enum: ['low','medium','high'], default: 'medium'},
    closeDate: Date,
    stage: {type: String, required: true},
    order: {type: Number, default: 0}
}, {timestamps: true})

dealSchema.index({tenantId: 1, stage: 1, order: 1})

const activitySchema=new Schema({
    tenantId:{type:Schema.Types.ObjectId,ref:'Tenant',required:true,index:true},
    userId:{type:Schema.Types.ObjectId,ref:'User'},
    entityType:{type:String,enum:["contact","team","deal","billing"]},
    entityId:Schema.Types.ObjectId,
    meta:Schema.Types.Mixed,
    action:String
},{timestamps:true})

activitySchema.index({tenantId:1,createdAt:-1})

const inviteSchema=new Schema({
    tenantId:{type:Schema.Types.ObjectId,ref:'Tenant',required:true,index:true},
    email:{type:String,lowercase:true,required:true},
    role:{type:String,enum:['member','admin'],default:'member'},
    expiresAt:{type:Date,default:()=>new Date(Date.now()+7*24*60*60*1000)},
    accepted:{type:Boolean,default:false},
    token:{type:String,required:true,unique:true}
},{timestamps:true})



export const Tenant=model('Tenant',tenantSchema)
export const User=model('User',userSchema)
export const Contact=model('Contact',contactSchema)
export const Deal=model('Deal',dealSchema)
export const Activity=model('Activity',activitySchema)
export const Invite=model('Invite',inviteSchema)