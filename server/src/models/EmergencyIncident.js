import mongoose from 'mongoose';

const emergencyIncidentSchema = new mongoose.Schema(
  {
    incidentCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['MEDICAL', 'ACCIDENT', 'FIRE', 'CRIME', 'GENERAL'],
      default: 'GENERAL',
    },
    status: {
      type: String,
      enum: ['CREATED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED', 'RESOLVED'],
      default: 'CREATED',
      index: true,
    },
    triggerType: {
      type: String,
      enum: ['MANUAL', 'VOICE'],
      default: 'MANUAL',
    },
    initialLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      address: { type: String, default: '' },
    },
    audioEvidence: {
      fileUrl: { type: String, default: null },
      duration: { type: Number, default: 0 },
      mimetype: { type: String, default: '' },
      recordedAt: { type: Date, default: null },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EmergencyIncident', emergencyIncidentSchema);
