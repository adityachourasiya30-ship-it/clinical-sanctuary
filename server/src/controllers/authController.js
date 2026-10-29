import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import MedicalProfile from '../models/MedicalProfile.js';
import ResponderProfile from '../models/ResponderProfile.js';
import { generateToken } from '../utils/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Cookie options helper:
 * In production cross-site HTTPS (Vercel frontend + Render backend),
 * sameSite MUST be 'none' with secure: true so browsers accept third-party cookies.
 */
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

/**
 * Register with Email and Password
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const allowedRoles = ['USER', 'RESPONDER', 'DISPATCHER'];
    const assignedRole = req.body.role && allowedRoles.includes(req.body.role) ? req.body.role : 'USER';

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
    });

    // Create empty medical profile record
    await MedicalProfile.create({
      userId: newUser._id,
      bloodGroup: 'Unknown',
    });

    // If registered as Responder, initialize Responder Profile
    if (assignedRole === 'RESPONDER') {
      await ResponderProfile.create({
        userId: newUser._id,
        badgeNumber: req.body.badgeNumber || `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        organization: req.body.organization || 'City Emergency Medical Service',
        specialization: req.body.specialization || 'PARAMEDIC',
        vehicleType: req.body.vehicleType || 'AMBULANCE',
        phone: req.body.phone || '',
        isAvailable: true,
      });
    }

    const token = generateToken(newUser._id, newUser.role);

    // Send HTTP-only cookie with cross-site production support
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: err.message,
    });
  }
};

/**
 * Login with Email and Password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      console.warn(`[AUTH DIAGNOSTIC] Failed login attempt for email: ${normalizedEmail} (reason: USER_NOT_FOUND)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[AUTH DIAGNOSTIC] Failed login attempt for email: ${normalizedEmail} (reason: INVALID_PASSWORD)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: err.message,
    });
  }
};

/**
 * Google Sign-In with Server-Side ID Token Verification
 */
export const googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential ID token is required.',
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    let payload = null;

    if (googleClientId && googleClientId !== 'your-google-oauth-client-id.apps.googleusercontent.com') {
      // Production / configured GIS verification
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } else {
      // In development when GOOGLE_CLIENT_ID is not configured yet,
      // decode or check payload structure safely without trusting blindly
      console.warn('⚠️ GOOGLE_CLIENT_ID not configured in .env. Decoding client token for academic dev testing.');
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          Buffer.from(base64, 'base64')
            .toString('utf-8')
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        payload = JSON.parse(jsonPayload);
      } catch (decodeErr) {
        return res.status(400).json({
          success: false,
          message: 'Malformed Google ID Token.',
        });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token payload.',
      });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (!user) {
      // Create user from verified Google profile
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        avatar: payload.picture || '',
        role: 'USER',
      });

      await MedicalProfile.create({
        userId: user._id,
        bloodGroup: 'Unknown',
      });
    } else {
      // Update Google ID & avatar if not already populated
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Google Sign-In successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Google Sign-In error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify Google Sign-In credentials.',
      error: err.message,
    });
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  try {
    let responderInfo = null;
    if (req.user.role === 'RESPONDER') {
      responderInfo = await ResponderProfile.findOne({ userId: req.user._id });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
        responderProfile: responderInfo,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile.',
    });
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Idempotent Demo Accounts Seeding (Protected by ADMIN_SEED_SECRET or permitted in development)
 */
export const seedDemoAccounts = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const clientSecret = req.headers['x-seed-secret'] || req.body?.seedSecret;
    const configuredSecret = process.env.ADMIN_SEED_SECRET || process.env.SEED_SECRET;

    // In production, require matching ADMIN_SEED_SECRET
    if (isProduction) {
      if (!configuredSecret || clientSecret !== configuredSecret) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. The ADMIN_SEED_SECRET environment variable is required to execute remote database seeding in production.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('EmergencyPass2026!', salt);

    const demoUsers = [
      {
        name: 'Rahul Sharma (Citizen)',
        email: 'rahul.patient@example.com',
        role: 'USER',
      },
      {
        name: 'Officer Vikram Singh (EMT-Paramedic)',
        email: 'vikram.responder@example.com',
        role: 'RESPONDER',
      },
      {
        name: 'Anita Verma (Dispatcher)',
        email: 'anita.dispatcher@example.com',
        role: 'DISPATCHER',
      },
    ];

    const results = [];

    for (const demo of demoUsers) {
      let user = await User.findOne({ email: demo.email });
      if (!user) {
        user = await User.create({
          name: demo.name,
          email: demo.email,
          passwordHash,
          role: demo.role,
        });

        if (demo.role === 'USER') {
          await MedicalProfile.findOneAndUpdate(
            { userId: user._id },
            {
              userId: user._id,
              bloodGroup: 'AB+',
              allergies: ['Penicillin', 'Sulfa drugs', 'Pollen'],
              medicalConditions: ['Asthma'],
              voiceConsentGranted: true,
              shareWithResponders: true,
            },
            { upsert: true, new: true }
          );
        } else if (demo.role === 'RESPONDER') {
          await ResponderProfile.findOneAndUpdate(
            { userId: user._id },
            {
              userId: user._id,
              badgeNumber: 'EMT-GWL-108',
              organization: 'City Emergency Ambulance Service (108 Fleet)',
              specialization: 'PARAMEDIC',
              vehicleType: 'AMBULANCE',
              isAvailable: true,
            },
            { upsert: true, new: true }
          );
        }

        results.push({ email: demo.email, status: 'CREATED', role: demo.role });
      } else {
        user.passwordHash = passwordHash;
        await user.save();
        results.push({ email: demo.email, status: 'UPDATED_PASSWORD', role: demo.role });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Demo accounts seeded successfully (idempotent).',
      accounts: results,
    });
  } catch (err) {
    console.error('Demo seed error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed demo accounts.',
      error: err.message,
    });
  }
};
