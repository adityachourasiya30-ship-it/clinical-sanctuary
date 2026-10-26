import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyIncident',
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact',
      default: null,
    },
    contactName: {
      type: String,
      default: '',
    },
    recipientPhone: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['SMS', 'IN_APP', 'EMAIL'],
      default: 'SMS',
    },
    provider: {
      type: String,
      enum: ['TWILIO', 'DEV_SIMULATOR'],
      default: 'DEV_SIMULATOR',
    },
    status: {
      type: String,
      enum: ['SENT', 'SIMULATED', 'FAILED', 'QUEUED', 'PROVIDER_ACCEPTED', 'DELIVERED', 'ACKNOWLEDGED'],
      required: true,
    },
    messageSid: {
      type: String,
      default: null,
    },
    errorDetails: {
      type: String,
      default: null,
    },
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.model('NotificationLog', notificationLogSchema);
