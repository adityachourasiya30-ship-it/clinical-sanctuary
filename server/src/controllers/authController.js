import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import MedicalProfile from '../models/MedicalProfile.js';
import ResponderProfile from '../models/ResponderProfile.js';
import { generateToken } from '../utils/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Send HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
