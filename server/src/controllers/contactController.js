import EmergencyContact from '../models/EmergencyContact.js';

/**
 * List all emergency contacts for current user
 */
export const getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.user._id }).sort({
      isPrimary: -1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts.',
      error: err.message,
    });
  }
};

/**
 * Add a new emergency contact
 */
export const createContact = async (req, res) => {
  try {
    const { name, phone, relationship, isPrimary, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Contact name and phone number are required.',
      });
    }

    // If marked primary, optionally unmark previous primary contacts for consistency
    if (isPrimary) {
      await EmergencyContact.updateMany(
        { userId: req.user._id, isPrimary: true },
        { isPrimary: false }
      );
    }

    const contact = await EmergencyContact.create({
      userId: req.user._id,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship?.trim() || 'Family',
      isPrimary: Boolean(isPrimary),
      email: email?.trim() || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully.',
      contact,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create emergency contact.',
      error: err.message,
    });
  }
};

/**
 * Update an existing emergency contact
 */
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship, isPrimary, email } = req.body;

    const contact = await EmergencyContact.findOne({ _id: id, userId: req.user._id });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found or unauthorized.',
      });
    }

    if (isPrimary) {
      await EmergencyContact.updateMany(
        { userId: req.user._id, _id: { $ne: id }, isPrimary: true },
        { isPrimary: false }
      );
    }

    if (name) contact.name = name.trim();
    if (phone) contact.phone = phone.trim();
    if (relationship) contact.relationship = relationship.trim();
    if (isPrimary !== undefined) contact.isPrimary = Boolean(isPrimary);
    if (email !== undefined) contact.email = email.trim();

    await contact.save();

    return res.status(200).json({
      success: true,
      message: 'Contact updated successfully.',
      contact,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact.',
      error: err.message,
    });
  }
};

/**
 * Delete an emergency contact
 */
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await EmergencyContact.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found or unauthorized.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete contact.',
      error: err.message,
    });
  }
};
