import twilio from 'twilio';
import NotificationLog from '../models/NotificationLog.js';

let twilioClient = null;

const initTwilio = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken && accountSid.startsWith('AC')) {
    try {
      twilioClient = twilio(accountSid, authToken);
      console.log('✅ Twilio SMS client initialized successfully.');
    } catch (err) {
      console.warn('⚠️ Twilio initialization error:', err.message);
      twilioClient = null;
    }
  } else {
    console.log('ℹ️ Twilio credentials not configured. Using DevNotificationProvider (simulated mode).');
  }
};

initTwilio();

/**
 * Dispatches an emergency SMS alert to a contact.
 *
 * @param {Object} options
 * @param {string} options.incidentId
 * @param {string} options.contactId
 * @param {string} options.contactName
 * @param {string} options.recipientPhone
 * @param {string} options.senderName
 * @param {string} options.incidentCode
 * @param {string} options.category
 * @param {string} options.trackingUrl
 * @param {string} [options.medicalNotes]
 * @returns {Promise<Object>}
 */
export const sendEmergencySMS = async ({
  incidentId,
  contactId,
  contactName,
  recipientPhone,
  senderName,
  incidentCode,
  category,
  trackingUrl,
  medicalNotes,
}) => {
  const messageBody =
    `EMERGENCY ALERT: ${senderName} has triggered a ${category} SOS alert!\n` +
    `Incident: ${incidentCode}\n` +
    `Live Location & Status: ${trackingUrl}\n` +
    (medicalNotes ? `Medical Notes: ${medicalNotes}\n` : '') +
    `Sent via Clinical Sanctuary.`;

  // Production Twilio provider branch
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const response = await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipientPhone,
      });

      const log = await NotificationLog.create({
        incidentId,
        contactId,
        contactName,
        recipientPhone,
        channel: 'SMS',
        provider: 'TWILIO',
        status: 'SENT',
        messageSid: response.sid,
        dispatchedAt: new Date(),
      });

      return {
        success: true,
        provider: 'TWILIO',
        status: 'SENT',
        messageSid: response.sid,
        logId: log._id,
      };
    } catch (err) {
      console.error(`❌ Twilio SMS delivery failed to ${recipientPhone}:`, err.message);

      const log = await NotificationLog.create({
        incidentId,
        contactId,
        contactName,
        recipientPhone,
        channel: 'SMS',
        provider: 'TWILIO',
        status: 'FAILED',
        errorDetails: err.message,
        dispatchedAt: new Date(),
      });

      return {
        success: false,
        provider: 'TWILIO',
        status: 'FAILED',
        error: err.message,
        logId: log._id,
      };
    }
  }

  // Development simulation branch — explicitly labelled SIMULATED
  console.log(`\n======================================================`);
  console.log(`🚨 [DEV_SIMULATOR] Emergency SMS Dispatched (Simulated)`);
  console.log(`To: ${contactName} (${recipientPhone})`);
  console.log(`Content:\n${messageBody}`);
  console.log(`Notice: Simulated in development. No real SMS was charged.`);
  console.log(`======================================================\n`);

  const simLog = await NotificationLog.create({
    incidentId,
    contactId,
    contactName,
    recipientPhone,
    channel: 'SMS',
    provider: 'DEV_SIMULATOR',
    status: 'SIMULATED',
    messageSid: `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dispatchedAt: new Date(),
  });

  return {
    success: true,
    provider: 'DEV_SIMULATOR',
    status: 'SIMULATED',
    messageSid: simLog.messageSid,
    logId: simLog._id,
    devNotice: 'Simulated dispatch in development mode. Configured Twilio credentials for real SMS.',
  };
};
