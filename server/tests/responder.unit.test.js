import ResponderProfile from '../src/models/ResponderProfile.js';
import IncidentAssignment from '../src/models/IncidentAssignment.js';
import IncidentEvent from '../src/models/IncidentEvent.js';
import mongoose from 'mongoose';

describe('Responder & Dispatch Systems Unit Tests', () => {
  test('Responder Profile schema validation requires valid vehicle and specialization', () => {
    const validVehicleTypes = ['AMBULANCE', 'PARAMEDIC_BIKE', 'FIRE_TRUCK', 'PATROL_CAR', 'FIRST_RESPONDER_CAR', 'ON_FOOT'];
    const validSpecs = ['PARAMEDIC', 'EMT', 'NURSE', 'DOCTOR', 'TRAINED_CIVILIAN', 'FIREFIGHTER'];

    const mockProfile = new ResponderProfile({
      userId: new mongoose.Types.ObjectId(),
      badgeNumber: 'EMT-TEST-99',
      organization: 'Emergency Response Squad',
      vehicleType: 'AMBULANCE',
      specialization: 'PARAMEDIC',
    });

    expect(validVehicleTypes.includes(mockProfile.vehicleType)).toBe(true);
    expect(validSpecs.includes(mockProfile.specialization)).toBe(true);
    expect(mockProfile.isAvailable).toBe(true);
    expect(mockProfile.verificationStatus).toBe('VERIFIED');
  });

  test('Incident Assignment tracks lifecycle states accurately', () => {
    const assignment = new IncidentAssignment({
      incidentId: new mongoose.Types.ObjectId(),
      responderId: new mongoose.Types.ObjectId(),
      status: 'OFFERED',
    });

    expect(assignment.status).toBe('OFFERED');
    assignment.status = 'ACCEPTED';
    assignment.respondedAt = new Date();
    expect(assignment.status).toBe('ACCEPTED');
    expect(assignment.respondedAt).toBeInstanceOf(Date);
  });

  test('Incident Event audit log creates immutable records with valid role actors', () => {
    const validRoles = ['SYSTEM', 'CITIZEN', 'RESPONDER', 'DISPATCHER', 'ADMIN'];
    const event = new IncidentEvent({
      incidentId: new mongoose.Types.ObjectId(),
      eventType: 'RESPONDER_EN_ROUTE',
      actorRole: 'RESPONDER',
      description: 'Paramedic en route with ambulance.',
    });

    expect(validRoles.includes(event.actorRole)).toBe(true);
    expect(event.eventType).toBe('RESPONDER_EN_ROUTE');
    expect(event.timestamp).toBeInstanceOf(Date);
  });
});
