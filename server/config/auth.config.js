export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: '24h',
  googleClientID: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackURL: 'https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/auth/google/callback',
  emailService: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  }
}; 