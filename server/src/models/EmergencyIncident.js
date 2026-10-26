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
      enum: ['MEDICAL', 'ACCIDENT', 'ROAD_ACCIDENT', 'FIRE', 'CRIME', 'POLICE', 'GENERAL'],
      default: 'GENERAL',
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'LOCATION_PENDING',
        'SUBMITTED',
        'ACTIVE',
        'NOTIFYING',
        'NOTIFIED',
        'NOTIFICATION_PENDING',
        'NOTIFICATION_ATTEMPTED',
        'PARTIALLY_FAILED',
        'ACKNOWLEDGED',
        'ASSIGNED',
        'EN_ROUTE',
        'ARRIVED',
        'RESOLVED',
        'CANCELLED',
        'FAILED',
      ],
      default: 'CREATED',
      index: true,
    },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    assignedResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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
