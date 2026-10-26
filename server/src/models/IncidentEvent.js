import mongoose from 'mongoose';

const incidentEventSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyIncident',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'CREATED',
        'STATUS_CHANGE',
        'LOCATION_UPDATE',
        'NOTIFICATION_DISPATCH',
        'RESPONDER_ASSIGNED',
        'RESPONDER_ACCEPTED',
        'RESPONDER_REJECTED',
        'RESPONDER_EN_ROUTE',
        'RESPONDER_ARRIVED',
        'AUDIO_ATTACHED',
        'CANCELLED',
        'RESOLVED',
        'DISPATCHER_OVERRIDE',
      ],
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['SYSTEM', 'CITIZEN', 'RESPONDER', 'DISPATCHER', 'ADMIN'],
      default: 'SYSTEM',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

incidentEventSchema.index({ incidentId: 1, timestamp: 1 });

export default mongoose.model('IncidentEvent', incidentEventSchema);
