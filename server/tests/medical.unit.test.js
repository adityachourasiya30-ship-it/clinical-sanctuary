describe('Medical Profile & GDPR Compliance Unit Tests', () => {
  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', ''];

  test('Blood group validator should accept standard ABO/Rh blood groups and reject invalid strings', () => {
    const isBloodGroupValid = (bg) => validBloodGroups.includes(bg);

    expect(isBloodGroupValid('O+')).toBe(true);
    expect(isBloodGroupValid('AB-')).toBe(true);
    expect(isBloodGroupValid('B+')).toBe(true);
    expect(isBloodGroupValid('Unknown')).toBe(true);
    expect(isBloodGroupValid('XYZ+')).toBe(false);
    expect(isBloodGroupValid('C-')).toBe(false);
  });

  test('Allergy and condition tag sanitizer should trim whitespace and reject empty strings', () => {
    const sanitizeTags = (tags) => {
      if (!Array.isArray(tags)) return [];
      return tags.map((t) => t.trim()).filter(Boolean);
    };

    const rawInput = [' Penicillin ', '', '  Sulfa drugs  ', '   ', 'Pollen'];
    const cleaned = sanitizeTags(rawInput);

    expect(cleaned).toEqual(['Penicillin', 'Sulfa drugs', 'Pollen']);
    expect(cleaned.length).toBe(3);
  });

  test('JSON export bundle generator should package complete patient context without sensitive hashes', () => {
    const mockUser = {
      _id: '6650a1b2c3d4e5f6a7b8c9d0',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      passwordHash: '$2a$12$SuperSecretHash',
    };

    const mockProfile = {
      bloodGroup: 'AB+',
      allergies: ['Penicillin'],
      medicalConditions: ['Asthma'],
      voiceConsentGranted: true,
    };

    const generateExport = (user, profile, contacts = [], incidents = []) => {
      return {
        exportedAt: new Date().toISOString(),
        patientInfo: {
          name: user.name,
          email: user.email,
          userId: user._id,
        },
        medicalProfile: profile,
        emergencyContacts: contacts,
        incidentHistory: incidents,
      };
    };

    const exported = generateExport(mockUser, mockProfile);

    expect(exported.patientInfo.name).toBe('Rahul Sharma');
    expect(exported.medicalProfile.bloodGroup).toBe('AB+');
    expect(exported.patientInfo.passwordHash).toBeUndefined(); // Never export passwordHash!
    expect(exported.exportedAt).toBeDefined();
  });
});
