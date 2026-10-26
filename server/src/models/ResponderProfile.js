import mongoose from 'mongoose';

const responderProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    badgeNumber: {
      type: String,
      required: [true, 'Badge number is required'],
      trim: true,
      unique: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      default: 'City Emergency Medical Service',
    },
    specialization: {
      type: String,
      enum: ['PARAMEDIC', 'EMT', 'NURSE', 'DOCTOR', 'TRAINED_CIVILIAN', 'FIREFIGHTER'],
      default: 'PARAMEDIC',
    },
    vehicleType: {
      type: String,
      enum: ['AMBULANCE', 'PARAMEDIC_BIKE', 'FIRE_TRUCK', 'PATROL_CAR', 'FIRST_RESPONDER_CAR', 'ON_FOOT'],
      default: 'AMBULANCE',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentLocation: {
      latitude: { type: Number, default: 26.2183 }, // Default to MITS Gwalior region for demo
      longitude: { type: Number, default: 78.1828 },
      updatedAt: { type: Date, default: Date.now },
      address: { type: String, default: 'Station 1 - MITS Emergency Hub' },
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'VERIFIED',
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ResponderProfile', responderProfileSchema);
