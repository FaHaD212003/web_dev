import nodemailer from "nodemailer";
import dotenv from "dotenv";

const transporter = nodemailer.createTransport({
  service: "Gmail", // or your SMTP config
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
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Task ${action === "updated" ? "Updated" : "Assigned"}: ${taskTitle}`,
      html: `
        <h3>Hello,</h3>
        <p>A task has been ${action} to you:</p>
        <p><strong>Title:</strong> ${taskTitle}</p>
        <p>Please log in to your dashboard to view the details.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send notification email:", err.message);
  }
};
