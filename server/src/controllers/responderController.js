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
      if (req.query.force === 'true' || req.body?.force === true) {
        existingActiveAssignment.status = 'RESOLVED';
        existingActiveAssignment.resolvedAt = new Date();
        existingActiveAssignment.resolvedBy = responderId;
        await existingActiveAssignment.save();
      } else {
        return res.status(409).json({
          success: false,
          message: `You already have an active emergency incident (${existingActiveAssignment.incidentCode}) in progress. Please conclude it first or accept with force override.`,
          activeIncidentCode: existingActiveAssignment.incidentCode,
        });
      }
    }

    // Two-Tier Triage Gate: Verify Responder Tier against Incident Requirement
    let responderProfile = await ResponderProfile.findOne({ userId: responderId });
    if (!responderProfile) {
      responderProfile = await ResponderProfile.create({
        userId: responderId,
        badgeNumber: 'EMT-GWL-108',
        organization: 'Gwalior Emergency Medical Service',
        responderTier: 'TIER_2_MEDICAL',
      });
    }
    const responderTier = responderProfile?.responderTier || 'TIER_2_MEDICAL';

    const targetIncident = await EmergencyIncident.findById(id);
    if (!targetIncident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    if (['RESOLVED', 'CANCELLED'].includes(targetIncident.status)) {
      return res.status(400).json({ success: false, message: `Cannot accept incident in ${targetIncident.status} state.` });
    }

    const requiresMedical = targetIncident.responderTier === 'TIER_2_MEDICAL' || targetIncident.urgency === 'CRITICAL';
    if (requiresMedical && responderTier !== 'TIER_2_MEDICAL' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'This critical emergency requires Tier-2 Medical (CPR/First-Aid) certification. Please complete the verification assessment or dispatch to a certified paramedic.',
        requiresTier: 'TIER_2_MEDICAL',
        currentTier: responderTier,
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

    await incident.populate('assignedResponder', 'name phone email avatar role');

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

    // Update assignment record and increment impact wallet metrics
    if (status === 'RESOLVED') {
      await IncidentAssignment.findOneAndUpdate(
        { incidentId: incident._id, responderId },
        { status: 'COMPLETED', completedAt: new Date(), notes: notes || '' }
      );

      const isCritical = incident.responderTier === 'TIER_2_MEDICAL' || incident.urgency === 'CRITICAL';
      const earnedPoints = isCritical ? 100 : 50;

      await ResponderProfile.findOneAndUpdate(
        { userId: responderId },
        {
          $inc: {
            completedRescues: 1,
            impactPoints: earnedPoints,
            referralCredits: 1,
          },
        }
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

/**
 * Verify or upgrade Responder to Tier 2 (Medical / CPR Certified) via Quiz or Demo Bypass
 */
export const verifyTier2 = async (req, res) => {
  try {
    const responderId = req.user._id;
    const { score, total = 5, isDemoBypass = false } = req.body;

    const passingScore = 4; // 80% of 5
    const isPassed = isDemoBypass || (typeof score === 'number' && score >= passingScore);

    if (!isPassed) {
      return res.status(400).json({
        success: false,
        message: `Assessment score (${score || 0}/${total}) is below the 80% passing threshold (4/5 required). Please review emergency protocols and retry.`,
        passed: false,
        score: score || 0,
      });
    }

    const profile = await ResponderProfile.findOneAndUpdate(
      { userId: responderId },
      {
        $set: {
          responderTier: 'TIER_2_MEDICAL',
          tier2CertifiedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Congratulations! You are officially verified as Tier-2 Medical Responder (CPR/ALS Certified).',
      passed: true,
      profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify Tier-2 status.',
      error: err.message,
    });
  }
};

/**
 * Switch Responder Tier (for demo/testing between TIER_1_TRANSPORT and TIER_2_MEDICAL)
 */
export const setResponderTier = async (req, res) => {
  try {
    const responderId = req.user._id;
    const { tier } = req.body;

    if (!['TIER_1_TRANSPORT', 'TIER_2_MEDICAL'].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid responder tier specified.',
      });
    }

    const profile = await ResponderProfile.findOneAndUpdate(
      { userId: responderId },
      {
        $set: {
          responderTier: tier,
          tier2CertifiedAt: tier === 'TIER_2_MEDICAL' ? new Date() : null,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Responder tier set to ${tier}.`,
      profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update responder tier.',
      error: err.message,
    });
  }
};
