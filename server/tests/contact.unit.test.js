describe('Emergency Contact Management Unit Tests', () => {
  const validateContactInput = ({ name, phone, relationship }) => {
    if (!name || !name.trim()) return { valid: false, message: 'Name is required' };
    if (!phone || !phone.trim()) return { valid: false, message: 'Phone is required' };
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      return { valid: false, message: 'Invalid phone format' };
    }
    return { valid: true };
  };

  test('Contact validator should accept valid international and domestic phone numbers', () => {
    expect(validateContactInput({ name: 'Mother', phone: '+919876543210' }).valid).toBe(true);
    expect(validateContactInput({ name: 'Father', phone: '+1-555-0199' }).valid).toBe(true);
    expect(validateContactInput({ name: 'Dr. Priya', phone: '07512405600' }).valid).toBe(true);
  });

  test('Contact validator should reject empty names or invalid phone characters', () => {
    expect(validateContactInput({ name: '', phone: '+919876543210' }).valid).toBe(false);
    expect(validateContactInput({ name: 'Sibling', phone: 'abcdef' }).valid).toBe(false);
  });

  test('Primary contact update logic should demote existing primaries when new primary is set', () => {
    let contacts = [
      { id: 1, name: 'Contact A', isPrimary: true },
      { id: 2, name: 'Contact B', isPrimary: false },
    ];

    const markPrimary = (targetId) => {
      contacts = contacts.map((c) => ({
        ...c,
        isPrimary: c.id === targetId,
      }));
    };

    markPrimary(2);

    expect(contacts.find((c) => c.id === 2).isPrimary).toBe(true);
    expect(contacts.find((c) => c.id === 1).isPrimary).toBe(false);
  });
});
