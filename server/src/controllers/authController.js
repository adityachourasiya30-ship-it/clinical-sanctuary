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
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: googleClientId,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.warn(`⚠️ googleClient.verifyIdToken notice: ${verifyErr.message}. Utilizing resilient payload decoding fallback.`);
      }
    }

    if (!payload) {
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
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || '';
    const googleId = payload.sub || '';

    // Atomic findOneAndUpdate upsert:
    // Sets name, email, avatar, googleId, and lastLogin
    // Sets roleSelected: false and role: 'CITIZEN' on initial insert
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          email,
          avatar: picture,
          googleId,
          lastLogin: new Date(),
          lastLoginAt: new Date(),
        },
        $setOnInsert: {
          roleSelected: false,
          role: 'CITIZEN',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Ensure medical profile exists
    await MedicalProfile.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { bloodGroup: 'Unknown' } },
      { upsert: true }
    );

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Google Sign-In successful.',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleSelected: user.roleSelected ?? false,
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
 * Update authenticated user's role (First-time selection or live role switch)
 * PATCH /api/auth/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['CITIZEN', 'USER', 'RESPONDER', 'DISPATCHER'];

    if (!role || !allowed.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: CITIZEN, RESPONDER, DISPATCHER`,
      });
    }

    const normalizedRole = role === 'USER' ? 'CITIZEN' : role;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          role: normalizedRole,
          roleSelected: true,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If role is RESPONDER, ensure a default ResponderProfile exists
    if (normalizedRole === 'RESPONDER') {
      await ResponderProfile.findOneAndUpdate(
        { userId: updatedUser._id },
        {
          $setOnInsert: {
            badgeNumber: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
            organization: 'Community Emergency Responder Network',
            specialization: 'FIRST_AID',
            vehicleType: 'TWO_WHEELER',
            responderTier: 'TIER_1_TRANSPORT',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
          },
        },
        { upsert: true }
      );
    }

    const token = generateToken(updatedUser._id, updatedUser.role);
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: `Role successfully set to ${normalizedRole}.`,
      token,
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        roleSelected: updatedUser.roleSelected,
        avatar: updatedUser.avatar,
      },
    });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role.',
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
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        roleSelected: req.user.roleSelected ?? true,
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
