import ResponderProfile from '../models/ResponderProfile.js';
import EmergencyIncident from '../models/EmergencyIncident.js';
import IncidentAssignment from '../models/IncidentAssignment.js';
import IncidentEvent from '../models/IncidentEvent.js';
import MedicalProfile from '../models/MedicalProfile.js';
import User from '../models/User.js';

/**
 * Get profile of logged-in responder
 */
export const getMyProfile = async (req, res) => {
  try {
    let profile = await ResponderProfile.findOne({ userId: req.user._id });
    if (!profile) {
      // Auto-create for responder role if missing
      profile = await ResponderProfile.create({
        userId: req.user._id,
        badgeNumber: `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        organization: 'City Emergency Medical Service',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve responder profile.',
      error: err.message,
    });
  }
};

/**
 * Update availability status & location
 */
export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable, latitude, longitude, address } = req.body;

    let profile = await ResponderProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new ResponderProfile({ userId: req.user._id, badgeNumber: `MED-${Date.now().toString().slice(-4)}` });
    }

    if (typeof isAvailable === 'boolean') {
      profile.isAvailable = isAvailable;
    }

    if (latitude !== undefined && longitude !== undefined) {
      profile.currentLocation = {
        latitude,
        longitude,
        updatedAt: new Date(),
        address: address || profile.currentLocation?.address || '',
      };
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Duty status updated: ${profile.isAvailable ? 'AVAILABLE (ON DUTY)' : 'OFF DUTY'}`,
      profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update availability.',
      error: err.message,
    });
  }
};

/**
 * Get active incidents available for response
 */
export const getAvailableIncidents = async (req, res) => {
  try {
    const incidents = await EmergencyIncident.find({
      status: { $in: ['SEARCHING', 'CREATED', 'SUBMITTED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED'] },
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'name phone')
      .populate('assignedResponder', 'name');

    return res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available incidents.',
      error: err.message,
    });
  }
};

/**
 * Accept an emergency incident (Atomic MongoDB lock to avoid race conditions)
 */
export const acceptIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const responderId = req.user._id;

    // Check if responder already has another active assigned incident
    const existingActiveAssignment = await EmergencyIncident.findOne({
      assignedResponder: responderId,
      status: { $in: ['ASSIGNED', 'EN_ROUTE', 'ARRIVED'] },
      _id: { $ne: id },
    });

    if (existingActiveAssignment) {
      return res.status(409).json({
        success: false,
        message: `You already have an active emergency incident (${existingActiveAssignment.incidentCode}) in progress. Please conclude it first.`,
        activeIncidentCode: existingActiveAssignment.incidentCode,
      });
    }

    // Atomic findOneAndUpdate: Only match if assignedResponder is null or already this responder,
    // and status is unassigned/searching/active. Prevents two responders from claiming simultaneously.
    const incident = await EmergencyIncident.findOneAndUpdate(
      {
        _id: id,
        status: { $in: ['CREATED', 'SUBMITTED', 'ACTIVE', 'SEARCHING', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED'] },
        $or: [{ assignedResponder: null }, { assignedResponder: responderId }],
      },
      {
        $set: {
          assignedResponder: responderId,
          status: 'ASSIGNED',
        },
      },
      { new: true }
    );

    if (!incident) {
      // Check if incident was already taken or resolved
      const existing = await EmergencyIncident.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Incident not found.' });
      }
      if (['RESOLVED', 'CANCELLED'].includes(existing.status)) {
        return res.status(400).json({ success: false, message: `Cannot accept incident in ${existing.status} state.` });
      }
      return res.status(409).json({
        success: false,
        message: 'This emergency call was just claimed by another responding paramedic unit.',
      });
    }

    // Upsert assignment record
    await IncidentAssignment.findOneAndUpdate(
      { incidentId: incident._id, responderId },
      {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Audit Event
    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'RESPONDER_ACCEPTED',
      actorId: responderId,
      actorRole: 'RESPONDER',
      description: `Responder ${req.user.name} accepted the emergency dispatch (Tier: ${incident.responderTier || 'TIER_2_MEDICAL'}).`,
      metadata: { responderName: req.user.name, responderTier: incident.responderTier },
    });

    return res.status(200).json({
      success: true,
      message: 'Incident accepted. You are now designated as active responder.',
      incident,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to accept incident.',
      error: err.message,
    });
  }
};

/**
 * Update incident status (EN_ROUTE, ARRIVED, RESOLVED)
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, otp } = req.body;
    const responderId = req.user._id;

    const allowedTransitions = ['EN_ROUTE', 'ARRIVED', 'RESOLVED'];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. Allowed: ${allowedTransitions.join(', ')}`,
      });
    }

    const incident = await EmergencyIncident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    // Verify authorized responder or admin
    if (incident.assignedResponder && !incident.assignedResponder.equals(responderId) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not the designated responder for this incident.',
      });
    }

    // Optional Pickup OTP verification when reaching ARRIVED or RESOLVED
    let otpVerified = false;
    if (otp && incident.pickupOtp) {
      if (incident.pickupOtp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 4-digit pickup OTP. Please verify with the patient.',
        });
      }
      otpVerified = true;
    }

    const previousStatus = incident.status;
    incident.status = status;

    if (status === 'RESOLVED') {
      incident.resolvedAt = new Date();
      incident.resolvedBy = responderId;
    }

    await incident.save();

    // Update assignment record
    if (status === 'RESOLVED') {
      await IncidentAssignment.findOneAndUpdate(
        { incidentId: incident._id, responderId },
        { status: 'COMPLETED', completedAt: new Date(), notes: notes || '' }
      );
    }

    // Log Audit Event
    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: `RESPONDER_${status}`,
      actorId: responderId,
      actorRole: 'RESPONDER',
      description: `Responder ${req.user.name} changed status from ${previousStatus} to ${status}.${notes ? ` Notes: ${notes}` : ''}${otpVerified ? ' (Pickup OTP Verified)' : ''}`,
      metadata: { previousStatus, newStatus: status, notes, otpVerified },
    });

    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}.`,
      incident,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update incident status.',
      error: err.message,
    });
  }
};

/**
 * Get incident medical summary for authorized responder
 */
export const getIncidentMedicalSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await EmergencyIncident.findById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const medicalProfile = await MedicalProfile.findOne({ userId: incident.userId });
    if (!medicalProfile || !medicalProfile.shareWithResponders) {
      return res.status(200).json({
        success: true,
        shared: false,
        message: 'Patient has opted out of sharing detailed medical history with responders.',
        summary: null,
      });
    }

    return res.status(200).json({
      success: true,
      shared: true,
      summary: {
        bloodGroup: medicalProfile.bloodGroup,
        allergies: medicalProfile.allergies,
        medicalConditions: medicalProfile.medicalConditions,
        medications: medicalProfile.medications,
        emergencyNotes: medicalProfile.emergencyNotes,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical summary.',
      error: err.message,
    });
  }
};
