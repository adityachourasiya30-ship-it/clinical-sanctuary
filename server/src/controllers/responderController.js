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
      status: { $in: ['CREATED', 'SUBMITTED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED', 'ASSIGNED', 'EN_ROUTE'] },
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
 * Accept an emergency incident
 */
export const acceptIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const responderId = req.user._id;

    const incident = await EmergencyIncident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    if (['RESOLVED', 'CANCELLED'].includes(incident.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept an incident in ${incident.status} state.`,
      });
    }

    if (incident.assignedResponder && !incident.assignedResponder.equals(responderId)) {
      return res.status(409).json({
        success: false,
        message: 'This incident is already assigned to another responder.',
      });
    }

    incident.assignedResponder = responderId;
    incident.status = 'ASSIGNED';
    await incident.save();

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
      description: `Responder ${req.user.name} accepted the emergency dispatch.`,
      metadata: { responderName: req.user.name },
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
    const { status, notes } = req.body;
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
      description: `Responder ${req.user.name} changed status from ${previousStatus} to ${status}.${notes ? ` Notes: ${notes}` : ''}`,
      metadata: { previousStatus, newStatus: status, notes },
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
