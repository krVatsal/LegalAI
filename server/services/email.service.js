import nodemailer from 'nodemailer';
import { authConfig } from '../config/auth.config.js';

const transporter = nodemailer.createTransport(authConfig.emailService);

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: authConfig.emailService.auth.user,
    to: email,
    subject: 'Your Legal AI Assistant OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Legal AI Assistant - OTP Verification</h2>
        <p>Your OTP for login is:</p>
        <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}; 