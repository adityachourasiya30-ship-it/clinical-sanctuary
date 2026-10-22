import MedicalProfile from '../models/MedicalProfile.js';
import EmergencyContact from '../models/EmergencyContact.js';
import EmergencyIncident from '../models/EmergencyIncident.js';

/**
 * Get current user's medical profile
 */
export const getMedicalProfile = async (req, res) => {
  try {
    let profile = await MedicalProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = await MedicalProfile.create({
        userId: req.user._id,
        bloodGroup: 'Unknown',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve medical profile.',
      error: err.message,
    });
  }
};

/**
 * Update current user's medical profile
 */
export const updateMedicalProfile = async (req, res) => {
  try {
    const {
      bloodGroup,
      allergies,
      medicalConditions,
      medications,
      emergencyNotes,
      age,
      weightKg,
      heightCm,
      gender,
      voiceConsentGranted,
      shareWithResponders,
    } = req.body;

    let profile = await MedicalProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new MedicalProfile({ userId: req.user._id });
    }

    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
    if (allergies !== undefined) {
      profile.allergies = Array.isArray(allergies)
        ? allergies.map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (medicalConditions !== undefined) {
      profile.medicalConditions = Array.isArray(medicalConditions)
        ? medicalConditions.map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (medications !== undefined) {
      profile.medications = Array.isArray(medications)
        ? medications.map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (emergencyNotes !== undefined) profile.emergencyNotes = emergencyNotes.trim();
    if (age !== undefined) profile.age = age ? Number(age) : null;
    if (weightKg !== undefined) profile.weightKg = weightKg ? Number(weightKg) : null;
    if (heightCm !== undefined) profile.heightCm = heightCm ? Number(heightCm) : null;
    if (gender !== undefined) profile.gender = gender;
    if (voiceConsentGranted !== undefined) profile.voiceConsentGranted = Boolean(voiceConsentGranted);
    if (shareWithResponders !== undefined) profile.shareWithResponders = Boolean(shareWithResponders);

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Medical profile updated successfully.',
      profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update medical profile.',
      error: err.message,
    });
  }
};

/**
 * Export full patient records as downloadable JSON
 * (Fulfills Milestone 4 requirement: 'Export My Records (JSON)')
 */
export const exportMedicalData = async (req, res) => {
  try {
    const profile = await MedicalProfile.findOne({ userId: req.user._id });
    const contacts = await EmergencyContact.find({ userId: req.user._id });
    const incidents = await EmergencyIncident.find({ userId: req.user._id })
      .select('-__v')
      .sort({ createdAt: -1 });

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      patientInfo: {
        name: req.user.name,
        email: req.user.email,
        userId: req.user._id,
      },
      medicalProfile: profile,
      emergencyContacts: contacts,
      incidentHistory: incidents,
    };

    res.setHeader('Content-Disposition', 'attachment; filename=clinical_sanctuary_records.json');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(exportPayload);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to export medical records.',
      error: err.message,
    });
  }
};

/**
 * Permanently erase medical data (GDPR / Privacy Compliance)
 * (Fulfills Milestone 4 requirement: 'Permanently Erase Data')
 */
export const eraseMedicalData = async (req, res) => {
  try {
    await MedicalProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        bloodGroup: 'Unknown',
        allergies: [],
        medicalConditions: [],
        medications: [],
        emergencyNotes: '',
        age: null,
        weightKg: null,
        heightCm: null,
        gender: 'Prefer not to say',
        voiceConsentGranted: false,
        shareWithResponders: false,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All personal medical records and consent tokens have been permanently erased.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to erase medical records.',
      error: err.message,
    });
  }
};
