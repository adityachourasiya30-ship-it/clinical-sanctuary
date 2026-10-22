import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
      default: 'Family',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EmergencyContact', emergencyContactSchema);
