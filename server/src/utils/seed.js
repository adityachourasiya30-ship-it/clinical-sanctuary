import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import MedicalProfile from '../models/MedicalProfile.js';
import EmergencyIncident from '../models/EmergencyIncident.js';
import NotificationLog from '../models/NotificationLog.js';
import ResponderProfile from '../models/ResponderProfile.js';
import IncidentAssignment from '../models/IncidentAssignment.js';
import IncidentEvent from '../models/IncidentEvent.js';

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emergency_alert_system';

  console.log('🔄 Connecting to database for seeding...');
  await mongoose.connect(uri);

  console.log('🧹 Clearing previous demo data...');
  const demoEmails = [
    'rahul.patient@example.com',
    'vikram.responder@example.com',
    'anita.dispatcher@example.com',
  ];

  const existingUsers = await User.find({ email: { $in: demoEmails } });
  const userIds = existingUsers.map((u) => u._id);

  if (userIds.length > 0) {
    await EmergencyContact.deleteMany({ userId: { $in: userIds } });
    await MedicalProfile.deleteMany({ userId: { $in: userIds } });
    await ResponderProfile.deleteMany({ userId: { $in: userIds } });
    await EmergencyIncident.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('EmergencyPass2026!', salt);

  // 1. Citizen / Patient Persona (Rahul Sharma)
  console.log('👤 Creating verified demo citizen account (Rahul Sharma)...');
  const demoPatient = await User.create({
    name: 'Rahul Sharma (Citizen)',
    email: 'rahul.patient@example.com',
    passwordHash,
    role: 'USER',
  });

  const primaryContact = await EmergencyContact.create({
    userId: demoPatient._id,
    name: 'Dr. Priya Sharma (Physician)',
    phone: '+919876543210',
    relationship: 'Doctor',
    isPrimary: true,
    email: 'priya.demo@example.com',
  });

  await EmergencyContact.create({
    userId: demoPatient._id,
    name: 'Rajesh Sharma (Parent)',
    phone: '+919876543211',
    relationship: 'Parent',
    isPrimary: false,
    email: 'rajesh.demo@example.com',
  });

  await MedicalProfile.create({
    userId: demoPatient._id,
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

  // 2. Verified Responder Persona (Officer Vikram Singh)
  console.log('🚑 Creating verified responder account (Officer Vikram Singh)...');
  const demoResponder = await User.create({
    name: 'Officer Vikram Singh (EMT-Paramedic)',
    email: 'vikram.responder@example.com',
    passwordHash,
    role: 'RESPONDER',
  });

  await ResponderProfile.create({
    userId: demoResponder._id,
    badgeNumber: 'EMT-GWL-108',
    organization: 'Gwalior Emergency Ambulance Service (108 Fleet)',
    specialization: 'PARAMEDIC',
    vehicleType: 'AMBULANCE',
    phone: '+919876543220',
    isAvailable: true,
    currentLocation: {
      latitude: 26.2201,
      longitude: 78.1812,
      updatedAt: new Date(),
      address: 'MITS Gate 1 Emergency Staging Station',
    },
    verificationStatus: 'VERIFIED',
  });

  // 3. Central Dispatcher Persona (Anita Verma)
  console.log('📻 Creating central dispatcher account (Anita Verma)...');
  await User.create({
    name: 'Anita Verma (Control Room Lead)',
    email: 'anita.dispatcher@example.com',
    passwordHash,
    role: 'DISPATCHER',
  });

  // 4. Sample Historic Incident
  console.log('📜 Creating sample historic incident...');
  const demoIncident = await EmergencyIncident.create({
    incidentCode: 'CS-20261020-DEMO',
    userId: demoPatient._id,
    category: 'MEDICAL',
    status: 'RESOLVED',
    triggerType: 'MANUAL',
    initialLocation: {
      latitude: 26.2183,
      longitude: 78.1828,
      accuracy: 8.5,
      address: 'MITS Campus, Gwalior, Madhya Pradesh',
    },
    resolvedAt: new Date(Date.now() - 3600000),
    resolvedBy: demoPatient._id,
    createdAt: new Date(Date.now() - 4200000),
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

  await IncidentEvent.create({
    incidentId: demoIncident._id,
    eventType: 'CREATED',
    actorId: demoPatient._id,
    actorRole: 'CITIZEN',
    description: 'Emergency alert activated manually.',
    timestamp: demoIncident.createdAt,
  });

  await IncidentEvent.create({
    incidentId: demoIncident._id,
    eventType: 'RESOLVED',
    actorId: demoPatient._id,
    actorRole: 'CITIZEN',
    description: 'Incident resolved safely by user.',
    timestamp: demoIncident.resolvedAt,
  });

  console.log('\n========================================================================');
  console.log('✅ Next-Gen Clinical Sanctuary Seed Completed Successfully!');
  console.log('👤 Citizen:    rahul.patient@example.com    / EmergencyPass2026!');
  console.log('🚑 Responder:  vikram.responder@example.com / EmergencyPass2026!');
  console.log('📻 Dispatcher: anita.dispatcher@example.com / EmergencyPass2026!');
  console.log('🏥 Database:   emergency_alert_system (Mongoose models populated)');
  console.log('========================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('Seeding error:', err.message);
  process.exit(1);
});
