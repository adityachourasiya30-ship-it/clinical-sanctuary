import EmergencyIncident from '../models/EmergencyIncident.js';
import LocationUpdate from '../models/LocationUpdate.js';
import EmergencyContact from '../models/EmergencyContact.js';
import MedicalProfile from '../models/MedicalProfile.js';
import NotificationLog from '../models/NotificationLog.js';
import IncidentEvent from '../models/IncidentEvent.js';
import ResponderProfile from '../models/ResponderProfile.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateIncidentCode } from '../utils/idGenerator.js';
import { sendEmergencySMS } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Robust helper to locate an incident by either MongoDB _id or incidentCode
 */
const findIncidentByIdOrCode = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const inc = await EmergencyIncident.findById(identifier);
    if (inc) return inc;
  }
  return await EmergencyIncident.findOne({ incidentCode: identifier });
};

/**
 * Safe ownership verification
 */
const isIncidentOwner = (incident, user) => {
  if (!incident || !incident.userId || !user) return false;
  const incUserId = incident.userId._id ? incident.userId._id.toString() : incident.userId.toString();
  const reqUserId = user._id ? user._id.toString() : user.toString();
  return incUserId === reqUserId;
};

/**
 * Trigger SOS Emergency Alert
 */
export const triggerSOS = async (req, res) => {
  try {
    const { category, triggerType, latitude, longitude, accuracy, address } = req.body;
    const userId = req.user._id;

    // Guard against rapid duplicate clicks (debounce window: 15s)
    const existingActive = await EmergencyIncident.findOne({
      userId,
      status: { $in: ['CREATED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED'] },
      createdAt: { $gte: new Date(Date.now() - 15000) },
    });

    if (existingActive) {
      return res.status(200).json({
        success: true,
        message: 'Active emergency already in progress. Continuing existing tracking session.',
        incident: existingActive,
        trackingUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${existingActive.incidentCode}`,
      });
    }

    const incidentCode = generateIncidentCode();

    const incident = await EmergencyIncident.create({
      incidentCode,
      userId,
      category: category || 'GENERAL',
      triggerType: triggerType || 'MANUAL',
      status: 'ACTIVE',
      initialLocation: {
        latitude: latitude || null,
        longitude: longitude || null,
        accuracy: accuracy || null,
        address: address || '',
      },
    });

    // Log Creation Audit Event
    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'CREATED',
      actorId: userId,
      actorRole: 'CITIZEN',
      description: `Emergency alert activated via ${triggerType || 'MANUAL'} trigger. Category: ${category || 'GENERAL'}.`,
      metadata: { initialLocation: incident.initialLocation },
    });

    // Save initial coordinates into LocationUpdate stream if provided
    if (latitude && longitude) {
      await LocationUpdate.create({
        incidentId: incident._id,
        userId,
        latitude,
        longitude,
        accuracy: accuracy || 0,
      });
    }

    // Retrieve contacts
    const contacts = await EmergencyContact.find({ userId });
    const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${incidentCode}`;

    // Medical notes summary if user consented
    const medicalProfile = await MedicalProfile.findOne({ userId });
    let medicalSummary = '';
    if (medicalProfile && medicalProfile.shareWithResponders) {
      const blood = medicalProfile.bloodGroup !== 'Unknown' ? `Blood Group: ${medicalProfile.bloodGroup}` : '';
      const allergies = medicalProfile.allergies?.length ? `Allergies: ${medicalProfile.allergies.join(', ')}` : '';
      medicalSummary = [blood, allergies].filter(Boolean).join(' | ');
    }

    incident.status = 'NOTIFYING';
    await incident.save();

    // Send notifications to contacts
    const notificationResults = [];
    let hasFailure = false;

    if (contacts.length === 0) {
      console.log('ℹ️ No emergency contacts configured for user. Alert logged to system.');
      incident.status = 'ACTIVE';
      await incident.save();
    } else {
      for (const contact of contacts) {
        const result = await sendEmergencySMS({
          incidentId: incident._id,
          contactId: contact._id,
          contactName: contact.name,
          recipientPhone: contact.phone,
          senderName: req.user.name,
          incidentCode: incident.incidentCode,
          category: incident.category,
          trackingUrl,
          medicalNotes: medicalSummary,
        });

        notificationResults.push({
          contactName: contact.name,
          phone: contact.phone,
          provider: result.provider,
          status: result.status,
          messageSid: result.messageSid,
          error: result.error,
        });

        if (!result.success) {
          hasFailure = true;
        }
      }

      incident.status = hasFailure ? 'PARTIALLY_FAILED' : 'NOTIFIED';
      await incident.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency SOS activated successfully.',
      incident: {
        id: incident._id,
        incidentCode: incident.incidentCode,
        category: incident.category,
        status: incident.status,
        triggerType: incident.triggerType,
        initialLocation: incident.initialLocation,
        createdAt: incident.createdAt,
        trackingUrl,
      },
      notificationResults,
    });
  } catch (err) {
    console.error('SOS trigger error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger emergency SOS.',
      error: err.message,
    });
  }
};

/**
 * Record live GPS telemetry (5s updates during emergency)
 */
export const recordLocationUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required.',
      });
    }

    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    const isOwner = isIncidentOwner(incident, req.user);
    const isStaff = ['DISPATCHER', 'ADMIN', 'RESPONDER'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update location for this incident.',
      });
    }

    if (incident.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot push location updates to a resolved incident. Tracking terminated.',
      });
    }

    const update = await LocationUpdate.create({
      incidentId: incident._id,
      userId: req.user._id,
      latitude,
      longitude,
      accuracy: accuracy || 0,
      speed: speed !== undefined ? speed : null,
      heading: heading !== undefined ? heading : null,
      timestamp: new Date(),
    });

    return res.status(201).json({
      success: true,
      update: {
        id: update._id,
        latitude: update.latitude,
        longitude: update.longitude,
        accuracy: update.accuracy,
        timestamp: update.timestamp,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record location update.',
      error: err.message,
    });
  }
};

/**
 * Get all coordinate breadcrumbs for an incident
 */
export const getLocationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = await LocationUpdate.find({ incidentId: id }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      count: updates.length,
      updates,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve location history.',
      error: err.message,
    });
  }
};

/**
 * Resolve an active incident
 */
export const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    const isOwner = isIncidentOwner(incident, req.user);
    const isStaff = ['DISPATCHER', 'ADMIN', 'RESPONDER'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update location for this incident.',
      });
    }

    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date();
    incident.resolvedBy = req.user._id;
    await incident.save();

    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'RESOLVED',
      actorId: req.user._id,
      actorRole: req.user.role || 'CITIZEN',
      description: `Incident marked as RESOLVED by ${req.user.name}.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Incident marked as RESOLVED. Live tracking terminated.',
      incident,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve incident.',
      error: err.message,
    });
  }
};

/**
 * Get historical incidents for current user
 */
export const getIncidentHistory = async (req, res) => {
  try {
    const incidents = await EmergencyIncident.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incident history.',
      error: err.message,
    });
  }
};

/**
 * Public / Contact live tracking view for shared links
 */
export const getTrackIncident = async (req, res) => {
  try {
    const { incidentCode } = req.params;

    const incident = await EmergencyIncident.findOne({ incidentCode });
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Emergency incident tracking code not found.',
      });
    }

    const user = await User.findById(incident.userId).select('name avatar');
    const locationUpdates = await LocationUpdate.find({ incidentId: incident._id })
      .sort({ timestamp: 1 })
      .limit(100);

    const latestLocation = locationUpdates.length > 0
      ? locationUpdates[locationUpdates.length - 1]
      : incident.initialLocation;

    // Check if user allowed medical summary to responders
    const medicalProfile = await MedicalProfile.findOne({ userId: incident.userId });
    let medicalSummary = null;
    if (medicalProfile && medicalProfile.shareWithResponders) {
      medicalSummary = {
        bloodGroup: medicalProfile.bloodGroup,
        allergies: medicalProfile.allergies,
        medicalConditions: medicalProfile.medicalConditions,
        emergencyNotes: medicalProfile.emergencyNotes,
      };
    }

    const notificationLogs = await NotificationLog.find({ incidentId: incident._id })
      .select('recipientPhone contactName status provider dispatchedAt channel');

    // Fetch assigned responder info if present
    let responderDetails = null;
    if (incident.assignedResponder) {
      const respUser = await User.findById(incident.assignedResponder).select('name phone avatar');
      const respProfile = await ResponderProfile.findOne({ userId: incident.assignedResponder });
      if (respUser) {
        responderDetails = {
          name: respUser.name,
          phone: respUser.phone || respProfile?.phone || null,
          badgeNumber: respProfile?.badgeNumber || 'EMS-ACTIVE',
          organization: respProfile?.organization || 'Emergency Medical Services',
          vehicleType: respProfile?.vehicleType || 'AMBULANCE',
          location: respProfile?.currentLocation || null,
        };
      }
    }

    // Fetch recent events timeline
    const timelineEvents = await IncidentEvent.find({ incidentId: incident._id })
      .sort({ timestamp: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      incident: {
        incidentCode: incident.incidentCode,
        category: incident.category,
        status: incident.status,
        urgency: incident.urgency || 'HIGH',
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt,
        cancelledAt: incident.cancelledAt,
        cancellationReason: incident.cancellationReason,
        senderName: user?.name || 'Emergency User',
        avatar: user?.avatar || null,
        initialLocation: incident.initialLocation,
        latestLocation,
        assignedResponder: responderDetails,
        audioEvidence: incident.audioEvidence?.fileUrl ? true : false,
        medicalSummary,
        locationUpdates,
        notificationLogs,
        timelineEvents,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tracking data.',
      error: err.message,
    });
  }
};

/**
 * Upload Audio Evidence captured by MediaRecorder API
 */
export const uploadAudioEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio evidence file uploaded.',
      });
    }

    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    const isOwner = isIncidentOwner(incident, req.user);
    const isStaff = ['DISPATCHER', 'ADMIN', 'RESPONDER'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update location for this incident.',
      });
    }

    const fileUrl = `/uploads/audio/${req.file.filename}`;
    incident.audioEvidence = {
      fileUrl,
      duration: duration ? Number(duration) : 0,
      mimetype: req.file.mimetype,
      recordedAt: new Date(),
    };
    await incident.save();

    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'AUDIO_ATTACHED',
      actorId: req.user._id,
      actorRole: 'CITIZEN',
      description: `Audio recording evidence (${duration ? `${duration}s` : 'audio file'}) attached to emergency incident.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Audio evidence successfully linked to incident.',
      audioEvidence: incident.audioEvidence,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload audio evidence.',
      error: err.message,
    });
  }
};

/**
 * Cancel an active incident (citizen or dispatcher)
 */
export const cancelIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    // Must be incident owner or dispatcher/admin
    const isOwner = isIncidentOwner(incident, req.user);
    const isAuthorizedStaff = ['DISPATCHER', 'ADMIN'].includes(req.user.role);

    if (!isOwner && !isAuthorizedStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this incident.',
      });
    }

    if (['RESOLVED', 'CANCELLED'].includes(incident.status)) {
      return res.status(400).json({
        success: false,
        message: `Incident is already ${incident.status}.`,
      });
    }

    incident.status = 'CANCELLED';
    incident.cancelledAt = new Date();
    incident.cancellationReason = reason || 'Cancelled by user request.';
    await incident.save();

    // Log Audit Event
    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'CANCELLED',
      actorId: req.user._id,
      actorRole: req.user.role || 'CITIZEN',
      description: `Incident cancelled by ${req.user.name}. Reason: ${incident.cancellationReason}`,
      metadata: { reason: incident.cancellationReason },
    });

    return res.status(200).json({
      success: true,
      message: 'Emergency incident has been cancelled. Live tracking halted.',
      incident,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel incident.',
      error: err.message,
    });
  }
};

/**
 * Get full chronological audit events for an incident
 */
export const getIncidentEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const events = await IncidentEvent.find({ incidentId: incident._id }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve incident event history.',
      error: err.message,
    });
  }
};

/**
 * Protected Audio Evidence Streaming
 */
export const streamAudioEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await findIncidentByIdOrCode(id);

    if (!incident || !incident.audioEvidence?.fileUrl) {
      return res.status(404).json({ success: false, message: 'Audio evidence not found.' });
    }

    // Verify authorized party: owner, assigned responder, or admin/dispatcher
    const isOwner = incident.userId.equals(req.user._id);
    const isAssigned = incident.assignedResponder && incident.assignedResponder.equals(req.user._id);
    const isStaff = ['DISPATCHER', 'ADMIN'].includes(req.user.role);

    if (!isOwner && !isAssigned && !isStaff) {
      return res.status(403).json({ success: false, message: 'Unauthorized to access this private recording.' });
    }

    const filename = path.basename(incident.audioEvidence.fileUrl);
    const filePath = path.resolve(__dirname, '../../uploads/audio', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Audio file missing from server storage.' });
    }

    res.setHeader('Content-Type', incident.audioEvidence.mimetype || 'audio/webm');
    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to stream audio evidence.',
      error: err.message,
    });
  }
};

/**
 * Update active incident emergency category
 */
export const updateIncidentCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const allowed = ['MEDICAL', 'ACCIDENT', 'FIRE', 'CRIME', 'POLICE', 'GENERAL'];
    if (!allowed.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category.' });
    }

    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const isOwner = isIncidentOwner(incident, req.user);
    const isStaff = ['DISPATCHER', 'ADMIN'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const oldCategory = incident.category;
    incident.category = category;
    await incident.save();

    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'CATEGORY_UPDATED',
      actorId: req.user._id,
      actorRole: req.user.role || 'CITIZEN',
      description: `Emergency category updated from ${oldCategory} to ${category}.`,
    });

    return res.status(200).json({
      success: true,
      message: `Emergency category updated to ${category}.`,
      incident,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update category.', error: err.message });
  }
};

/**
 * Uber-Style Simulated Dispatch Advancement Flow (Demo & Single-Device testing)
 */
export const simulateUberDispatchFlow = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await findIncidentByIdOrCode(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    let responder = await User.findOne({ role: 'RESPONDER' });
    if (!responder) {
      responder = await User.findOne({ email: 'vikram.responder@example.com' });
    }

    let nextStatus = 'ASSIGNED';
    let description = '';

    if (['CREATED', 'SUBMITTED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED'].includes(incident.status)) {
      nextStatus = 'ASSIGNED';
      incident.assignedResponder = responder?._id || req.user._id;
      description = 'Ambulance Unit Matched: Officer Vikram Singh (ALS-104) has accepted the dispatch.';
    } else if (incident.status === 'ASSIGNED') {
      nextStatus = 'EN_ROUTE';
      description = 'Ambulance ALS-104 is EN ROUTE with sirens activated. Estimated arrival: ~3 minutes.';
    } else if (incident.status === 'EN_ROUTE') {
      nextStatus = 'ARRIVED';
      description = 'Ambulance unit arrived on scene at patient coordinates. Medical triage initiated.';
    } else if (incident.status === 'ARRIVED') {
      nextStatus = 'RESOLVED';
      incident.resolvedAt = new Date();
      incident.resolvedBy = responder?._id || req.user._id;
      description = 'Emergency medical care administered. Patient stabilized. Incident marked RESOLVED.';
    }

    incident.status = nextStatus;
    await incident.save();

    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: `STATUS_${nextStatus}`,
      actorId: responder?._id || req.user._id,
      actorRole: 'RESPONDER',
      description,
    });

    return res.status(200).json({
      success: true,
      nextStatus,
      message: description,
      incident,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Simulation error.', error: err.message });
  }
};
