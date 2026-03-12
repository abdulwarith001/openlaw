import { Resend } from "resend";

export async function sendAccessCodeEmail(email: string, code: string, credits: number) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: "OpenLaw <noreply@notifications.openlaw.live>",
    to: email,
    subject: "Your OpenLaw Access Code",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0B0B0F; color: #E6E6F0;">
        <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #E6E6F0;">OpenLaw</h1>
        <p style="color: #9A9AAF; margin-bottom: 32px;">Nigerian Constitutional Legal Assistant</p>
        
        <div style="background: #12121A; border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 40px 32px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <div style="width: 56px; height: 56px; background: rgba(79, 124, 255, 0.1); border: 1px solid rgba(79, 124, 255, 0.2); border-radius: 16px; margin: 0 auto 24px flex; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px;">🔑</span>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 700; color: #E6E6F0; margin-bottom: 8px;">Order Confirmed!</h2>
          <p style="color: #9A9AAF; font-size: 14px; margin-bottom: 32px;">Your credits have been added to your account.</p>
          
          <div style="background: #0B0B0F; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #9A9AAF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Access Code</p>
            <h3 style="font-size: 28px; font-weight: 800; font-family: 'Space Mono', monospace; color: #4F7CFF; margin: 0; letter-spacing: 2px;">${code}</h3>
          </div>
          
          <div style="background: rgba(79, 124, 255, 0.05); border-radius: 12px; padding: 12px; margin-bottom: 32px;">
            <p style="color: #4F7CFF; font-size: 13px; font-weight: 600; margin: 0;">
              ✨ ${credits} Questions Unlocked
            </p>
          </div>
          
          <a href="https://openlaw.live/chat" style="display: block; background: #4F7CFF; color: #FFFFFF; text-decoration: none; padding: 16px; rounded: 12px; font-weight: 700; font-size: 15px; border-radius: 12px; transition: background 0.2s;">
            Start Chatting Now
          </a>
        </div>
        
        <p style="color: #62627A; font-size: 12px; margin-top: 32px; text-align: center; line-height: 1.6;">
          Save this code! You can use it on any device to access your purchased credits. If you have any issues, reply to this email.
        </p>
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <p style="color: #4B4B5E; font-size: 11px;">&copy; 2025 OpenLaw Nigerian Constitutional Assistant</p>
        </div>
      </div>
    `,
  });
}
