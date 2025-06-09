import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Test email configuration
async function testEmail() {
    try {
        console.log('Testing email configuration...');
        
        // Verify transporter
        await transporter.verify();
        console.log('✅ Email transporter verified successfully');
        
        // Send test email
        const testEmail = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself for testing
            subject: 'Test Email - Legal AI Assistant',
            html: `
                <h2>Email Configuration Test</h2>
                <p>If you're reading this, your email configuration is working correctly!</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
            `
        };
        
        const result = await transporter.sendMail(testEmail);
        console.log('✅ Test email sent successfully');
        console.log('Message ID:', result.messageId);
        
    } catch (error) {
        console.error('❌ Email test failed:');
        console.error('Error:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n🔧 Authentication failed. Please check:');
            console.log('1. Your email address is correct');
            console.log('2. You\'re using an App Password (not your regular password)');
            console.log('3. 2-Factor Authentication is enabled on your Google account');
        }
        
        if (error.code === 'ECONNECTION') {
            console.log('\n🔧 Connection failed. Please check:');
            console.log('1. Your internet connection');
            console.log('2. SMTP settings (host, port)');
        }
    }
}

testEmail();
