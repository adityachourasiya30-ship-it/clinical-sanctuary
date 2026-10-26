import mongoose from 'mongoose';

const incidentAssignmentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyIncident',
      required: true,
      index: true,
    },
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['OFFERED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'OFFERED',
      index: true,
    },
    offeredAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique assignment queries
incidentAssignmentSchema.index({ incidentId: 1, responderId: 1 });

export default mongoose.model('IncidentAssignment', incidentAssignmentSchema);
