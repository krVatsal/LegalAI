import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';
import { sendOTPEmail } from '../services/email.service.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';

const router = express.Router();

// Configure JWT Strategy
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: authConfig.jwtSecret
  },
  async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: authConfig.googleClientID,
    clientSecret: authConfig.googleClientSecret,
    callbackURL: authConfig.googleCallbackURL,
    proxy: true,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.name = profile.displayName;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            email: profile.emails[0].value,
            name: profile.displayName,
            googleId: profile.id
          });
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Gmail OTP Routes
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    await OTP.create({
      email,
      otp
    });

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
      console.log('User ID from token:', req.user.id); // Debug log
      
      if (!req.user || !req.user.id) {
        console.error('No user ID in request');
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
      }

      const user = await User.findById(req.user.id).select('-password');
      console.log('Found user:', user); // Debug log
      
      if (!user) {
        console.error('User not found in database');
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Detailed error in /me route:', error);
      return res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });


router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the most recent unused OTP for the email
    const otpRecord = await OTP.findOne({
      email,
      otp,
      isUsed: false,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiration }
    );

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiration }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  }
);

export default router; 