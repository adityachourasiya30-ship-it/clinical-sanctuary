import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import MedicalProfile from '../models/MedicalProfile.js';
import EmergencyIncident from '../models/EmergencyIncident.js';
import NotificationLog from '../models/NotificationLog.js';

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinical_sanctuary';

  console.log('🔄 Connecting to database for seeding...');
  await mongoose.connect(uri);

  console.log('🧹 Clearing previous demo data...');
  const demoEmail = 'rahul.patient@example.com';
  const existingUser = await User.findOne({ email: demoEmail });

  if (existingUser) {
    await EmergencyContact.deleteMany({ userId: existingUser._id });
    await MedicalProfile.deleteMany({ userId: existingUser._id });
    await EmergencyIncident.deleteMany({ userId: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }

  console.log('👤 Creating verified demo patient account (Rahul Sharma)...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('EmergencyPass2026!', salt);

  const demoUser = await User.create({
    name: 'Rahul Sharma (Demo)',
    email: demoEmail,
    passwordHash,
    role: 'USER',
  });

  console.log('📞 Creating sample emergency contacts...');
  const primaryContact = await EmergencyContact.create({
    userId: demoUser._id,
    name: 'Dr. Priya Sharma (Demo Physician)',
    phone: '+919876543210',
    relationship: 'Doctor',
    isPrimary: true,
    email: 'priya.demo@example.com',
  });

  await EmergencyContact.create({
    userId: demoUser._id,
    name: 'Rajesh Sharma (Demo Parent)',
    phone: '+919876543211',
    relationship: 'Parent',
    isPrimary: false,
    email: 'rajesh.demo@example.com',
  });

  console.log('🏥 Creating realistic patient medical profile (Matches Milestone 4)...');
  await MedicalProfile.create({
    userId: demoUser._id,
    bloodGroup: 'AB+',
    allergies: ['Penicillin', 'Sulfa drugs', 'Pollen'],
    medicalConditions: ['Asthma', 'Hypertension (mild)'],
    medications: ['Salbutamol Inhaler (100mcg)', 'Amlodipine (5mg)'],
    emergencyNotes: 'Carries rescue inhaler in outer bag pocket. Asthmatic under cold air distress.',
    age: 28,
    weightKg: 72,
    heightCm: 175,
    gender: 'Male',
    voiceConsentGranted: true,
    shareWithResponders: true,
  });

  console.log('📜 Creating sample archived emergency incident...');
  const demoIncident = await EmergencyIncident.create({
    incidentCode: 'CS-20261020-DEMO',
    userId: demoUser._id,
    category: 'MEDICAL',
    status: 'RESOLVED',
    triggerType: 'MANUAL',
    initialLocation: {
      latitude: 26.2183,
      longitude: 78.1828,
      accuracy: 8.5,
      address: 'MITS Campus, Gwalior, Madhya Pradesh',
    },
    resolvedAt: new Date(Date.now() - 3600000), // 1 hour ago
    resolvedBy: demoUser._id,
    createdAt: new Date(Date.now() - 4200000), // 70 mins ago
  });

  await NotificationLog.create({
    incidentId: demoIncident._id,
    contactId: primaryContact._id,
    contactName: primaryContact.name,
    recipientPhone: primaryContact.phone,
    channel: 'SMS',
    provider: 'DEV_SIMULATOR',
    status: 'SIMULATED',
    messageSid: 'SIM-DEMO-20261020-001',
    dispatchedAt: demoIncident.createdAt,
  });

  console.log('\n======================================================');
  console.log('✅ Demo Seed Completed Successfully!');
  console.log('👤 Login Email:    rahul.patient@example.com');
  console.log('🔑 Login Password: EmergencyPass2026!');
  console.log('🏥 Health ID:      EAS-20261020 (AB+ Blood Group)');
  console.log('📞 Contacts:       2 demo contacts seeded');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('Seeding error:', err.message);
  process.exit(1);
});
