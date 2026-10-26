import EmergencyIncident from '../models/EmergencyIncident.js';
import ResponderProfile from '../models/ResponderProfile.js';
import IncidentAssignment from '../models/IncidentAssignment.js';
import IncidentEvent from '../models/IncidentEvent.js';
import NotificationLog from '../models/NotificationLog.js';
import User from '../models/User.js';

/**
 * Get operational incident queue for dispatchers/admins
 */
export const getDispatchQueue = async (req, res) => {
  try {
    const { category, status, urgency, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;

    const skip = (Number(page) - 1) * Number(limit);

    const [incidents, total] = await Promise.all([
      EmergencyIncident.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email avatar')
        .populate('assignedResponder', 'name'),
      EmergencyIncident.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      incidents,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dispatch queue.',
      error: err.message,
    });
  }
};

/**
 * Get eligible available responders list
 */
export const getAvailableResponders = async (req, res) => {
  try {
    const responders = await ResponderProfile.find({
      isAvailable: true,
      verificationStatus: 'VERIFIED',
    }).populate('userId', 'name email avatar');

    return res.status(200).json({
      success: true,
      count: responders.length,
      responders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available responders.',
      error: err.message,
    });
  }
};

/**
 * Dispatcher assigns responder to incident
 */
export const assignResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { responderUserId, notes } = req.body;

    if (!responderUserId) {
      return res.status(400).json({
        success: false,
        message: 'Responder user ID is required.',
      });
    }

    const incident = await EmergencyIncident.findById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const responderUser = await User.findById(responderUserId);
    if (!responderUser || responderUser.role !== 'RESPONDER') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an authorized responder.',
      });
    }

    incident.assignedResponder = responderUser._id;
    incident.status = 'ASSIGNED';
    await incident.save();

    await IncidentAssignment.findOneAndUpdate(
      { incidentId: incident._id, responderId: responderUser._id },
      {
        status: 'OFFERED',
        offeredAt: new Date(),
        notes: notes || 'Assigned by Central Dispatcher',
      },
      { upsert: true, new: true }
    );

    // Audit Event
    await IncidentEvent.create({
      incidentId: incident._id,
      eventType: 'RESPONDER_ASSIGNED',
      actorId: req.user._id,
      actorRole: req.user.role || 'DISPATCHER',
      description: `Dispatcher ${req.user.name} assigned responder ${responderUser.name} to this incident.`,
      metadata: { responderName: responderUser.name, notes },
    });

    return res.status(200).json({
      success: true,
      message: `Assigned responder ${responderUser.name} to incident ${incident.incidentCode}.`,
      incident,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign responder.',
      error: err.message,
    });
  }
};

/**
 * Dispatch operational summary stats
 */
export const getDispatchStats = async (req, res) => {
  try {
    const [totalIncidents, activeCount, resolvedCount, totalResponders, availableResponders] = await Promise.all([
      EmergencyIncident.countDocuments(),
      EmergencyIncident.countDocuments({ status: { $in: ['CREATED', 'SUBMITTED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED'] } }),
      EmergencyIncident.countDocuments({ status: 'RESOLVED' }),
      ResponderProfile.countDocuments(),
      ResponderProfile.countDocuments({ isAvailable: true, verificationStatus: 'VERIFIED' }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalIncidents,
        activeCount,
        resolvedCount,
        totalResponders,
        availableResponders,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dispatch statistics.',
      error: err.message,
    });
  }
};
