import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
dotenv.config();
console.log( process.env.SMTP_HOST)
console.log( process.env.SMTP_PORT)
console.log( process.env.SMTP_USER)
console.log( process.env.SMTP_PASS)
console.log( process.env.SMTP_FROM)

const transporter = nodemailer.createTransport({
    // Fallback options added just in case your .env has a typo
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, 
    service:'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
const send=(to,subject,html)=>{
    transporter.sendMail({from:process.env.SMTP_FROM,to,subject,html})
}

export const sendWelcomeEmail=(email,name,company)=>{
    send(email,`Welcome to CRM, ${name}!`,`
        <h2>Welcome aboard, ${name}!</h2>
        <p>Your workspace <strong>${company}</strong></p>
        <p>You have a 14-day free trial of the Pro plan. Enjoy!</p>
    `)
}


export const sendInviteEmail=(email,tenantName,inviterName,token)=>{
    send(email,`${inviterName} invited you to ${tenantName}`,`
        <h2>You have been invited to ${tenantName}</h2>
        <p>${inviterName} has invited you to join their CRM workspace.</p>
        <a href="${process.env.CLIENT_URL}/accept-invite?token=${token}"
        sytle "background: #6366f1;color:fff;padding:12px 24px; border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
        Accept invite
      </a>
      <p style="color:#888;margin-top:16px;font-size:13px">This invite expires in 7 days.</p>
      `)
}