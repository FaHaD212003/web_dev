import nodemailer from "nodemailer";
import dotenv from "dotenv";

const transporter = nodemailer.createTransport({
  service: "Gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendTaskNotification = async (
  recipientEmail,
  taskTitle,
  action = "assigned",
) => {
  try {
    const isUpdate = action === "updated";
    
    const mailOptions = {
      from: `"Regulate Task System" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Task ${isUpdate ? "Updated" : "Assigned"}: ${taskTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #cecece; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            
            <!-- Dark Header matching your App UI -->
            <div style="background-color: #18181b; padding: 24px; text-align: left;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px;">Regulate.</h1>
            </div>
            
            <!-- Main Content Body -->
            <div style="padding: 32px; text-align: left; color: #3f3f46;">
              <h2 style="margin-top: 0; color: #18181b; font-size: 20px;">Task Notification</h2>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Hello, <br><br>
                A task has been <strong>${action}</strong> to you in your workspace.
              </p>
              
              <!-- Highlighted Task Box -->
              <div style="background-color: #f4f4f5; border-left: 4px solid ${isUpdate ? '#3b82f6' : '#10b981'}; padding: 16px; border-radius: 4px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 16px; color: #18181b;"><strong>Task:</strong> ${taskTitle}</p>
              </div>
              
              <!-- Call to Action Button -->
              <a href="http://localhost:5173/login" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Dashboard</a>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #18181b; padding: 16px; text-align: center; color: #ffffff; font-size: 12px; border-top: 1px solid #e4e4e7;">
              This is an automated message from your Regulate workspace. Please do not reply.
            </div>
            
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send notification email:", err.message);
  }
};