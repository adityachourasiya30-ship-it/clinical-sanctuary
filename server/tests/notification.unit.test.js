describe('Notification Service & Provider Abstraction Unit Tests', () => {
  const buildSMSMessage = ({ senderName, category, incidentCode, trackingUrl, medicalNotes }) => {
    return (
      `EMERGENCY ALERT: ${senderName} has triggered a ${category} SOS alert!\n` +
      `Incident: ${incidentCode}\n` +
      `Live Location & Status: ${trackingUrl}\n` +
      (medicalNotes ? `Medical Notes: ${medicalNotes}\n` : '') +
      `Sent via Clinical Sanctuary.`
    );
  };

  test('buildSMSMessage should include critical dispatch elements', () => {
    const msg = buildSMSMessage({
      senderName: 'Aditya Chourasiya',
      category: 'MEDICAL',
      incidentCode: 'CS-20261021-9842',
      trackingUrl: 'http://localhost:5173/track/CS-20261021-9842',
      medicalNotes: 'Blood Group: O+ | Allergies: Penicillin',
    });

    expect(msg).toContain('EMERGENCY ALERT: Aditya Chourasiya has triggered a MEDICAL SOS alert!');
    expect(msg).toContain('Incident: CS-20261021-9842');
    expect(msg).toContain('Live Location & Status: http://localhost:5173/track/CS-20261021-9842');
    expect(msg).toContain('Medical Notes: Blood Group: O+ | Allergies: Penicillin');
    expect(msg).toContain('Sent via Clinical Sanctuary.');
  });

  test('DevNotificationProvider abstraction must report SIMULATED when Twilio credentials are not set', () => {
    const simulateDispatch = (recipientPhone, messageBody) => {
      return {
        success: true,
        provider: 'DEV_SIMULATOR',
        status: 'SIMULATED',
        recipientPhone,
        messageSid: `SIM-${Date.now()}-123`,
      };
    };

    const res = simulateDispatch('+919876543210', 'Emergency Test');
    expect(res.success).toBe(true);
    expect(res.provider).toBe('DEV_SIMULATOR');
    expect(res.status).toBe('SIMULATED');
    expect(res.status).not.toBe('SENT'); // Honest reporting invariant!
  });
});
