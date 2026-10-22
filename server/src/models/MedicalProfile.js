import mongoose from 'mongoose';

const medicalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', ''],
      default: 'Unknown',
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalConditions: {
      type: [String],
      default: [],
    },
    medications: {
      type: [String],
      default: [],
    },
    emergencyNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
    },
    weightKg: {
      type: Number,
      min: 0,
    },
    heightCm: {
      type: Number,
      min: 0,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say', ''],
      default: 'Prefer not to say',
    },
    voiceConsentGranted: {
      type: Boolean,
      default: false,
    },
    shareWithResponders: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('MedicalProfile', medicalProfileSchema);
