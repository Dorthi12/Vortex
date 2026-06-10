'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup, Textarea } from '@/components/ui/form';
import { Phone, Calendar, User, MapPin, CheckCircle2, ShieldAlert, HeartPulse } from 'lucide-react';

interface CallHealthProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: 'ambulance' | 'outbreak' | 'hospital' | 'vaccination' | 'general';
}

interface Professional {
  name: string;
  role: string;
  rating: string;
  avatarColor: string;
  dept: string;
  notice: string;
}

const PROFESSIONALS: Record<string, Professional> = {
  ambulance: {
    name: 'Dr. Ashok Mehta',
    role: 'Emergency Dispatcher',
    rating: '4.9 ★ (150+ dispatches)',
    avatarColor: 'bg-red-600',
    dept: 'District Ambulance Command Center',
    notice: 'Ambulance crews carry cardiac monitors, oxygen tanks, and trauma kits. Please keep citizen Aadhaar cards and medical files ready.',
  },
  outbreak: {
    name: 'Dr. Pradeep Naik',
    role: 'Epidemiologist Coordinator',
    rating: '4.8 ★ (75+ containment plans)',
    avatarColor: 'bg-amber-600',
    dept: 'Outbreak Intelligence & Vector Control',
    notice: 'Reporting localized clusters will dispatch a sanitation crew and water inspection officers to test regional pipelines.',
  },
  hospital: {
    name: 'Mrs. Savita Patil',
    role: 'Admissions Supervisor',
    rating: '4.9 ★ (320+ bed allocations)',
    avatarColor: 'bg-emerald-600',
    dept: 'District Bed Registry & Hospital Admissions',
    notice: 'Beds are reserved for up to 3 hours. Please bring the referral slip, symptom logs, or test reports to the admission counter.',
  },
  vaccination: {
    name: 'Dr. Anita Sharma',
    role: 'Immunization Lead',
    rating: '4.7 ★ (410+ dose registrations)',
    avatarColor: 'bg-indigo-600',
    dept: 'National Health Mission Immunization Hub',
    notice: 'Please bring a photo ID (Aadhaar/PAN) and any previous immunisation card records to verify the target vaccine phase.',
  },
  general: {
    name: 'Dr. Rohan Malhotra',
    role: 'Chief Medical Officer',
    rating: '4.9 ★ (500+ consultations)',
    avatarColor: 'bg-teal-600',
    dept: 'Pune Public Health Council Directorate',
    notice: 'General consults are routed to our online telemedicine services. A registered medical officer will call you back within 15 minutes.',
  },
};

export function CallHealthProfessionalModal({
  isOpen,
  onClose,
  defaultService = 'general',
}: CallHealthProfessionalModalProps) {
  const [service, setService] = useState<string>(defaultService);
  const [patientName, setPatientName] = useState<string>('Jane Doe');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [location, setLocation] = useState<string>('Sector 4B, Pune Division');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBooked, setIsBooked] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string>('');

  useEffect(() => {
    setService(defaultService);
  }, [defaultService]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsBooked(true);
      setTicketId(`TKT-HLTH-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1500);
  };

  const resetForm = () => {
    setIsBooked(false);
    setNotes('');
    onClose();
  };

  const activeProf = PROFESSIONALS[service] || PROFESSIONALS.general;

  const modalFooter = isBooked ? (
    <Button variant="primary" onClick={resetForm} className="w-full bg-med-green hover:bg-emerald-800 text-white font-bold cursor-pointer">
      Return to Dashboard
    </Button>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBooked ? "Request Confirmed" : "Request Healthcare Service Allocation"}
      footer={modalFooter}
    >
      {isBooked ? (
        <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="w-10 h-10 animate-bounce text-med-green" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
              Healthcare Request Registered!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Your request has been successfully assigned to our medical team. Relevant telemetry has been synced.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 border border-border-subtle rounded-lg p-3 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Health Telemetry Ticket ID</span>
            <div className="text-lg font-black text-med-green select-all mt-0.5">{ticketId}</div>
          </div>

          <div className="border border-border-subtle rounded-xl p-4 space-y-3 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-full ${activeProf.avatarColor} text-white font-black flex items-center justify-center shadow-inner`}>
                {activeProf.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{activeProf.name}</h4>
                  <span className="inline-flex items-center text-[9px] font-extrabold text-white bg-slate-600 px-1.5 py-0.5 rounded-sm">
                    {activeProf.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5">{activeProf.dept}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-med-green" /> Registered Schedule:
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                {date} at {time}
              </span>
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 rounded-lg p-3 flex gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-605 dark:text-slate-400 leading-relaxed">
              <strong>Patient Notice:</strong> {activeProf.notice}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormGroup label="Specialty Service Category" required>
            <Select value={service} onChange={(e) => setService(e.target.value)} className="h-10 text-xs">
              <option value="ambulance">Emergency Ambulance Request & Dispatch</option>
              <option value="hospital">Emergency Bed Reservation & Allocation</option>
              <option value="vaccination">Vaccine Slot Booking & Dose Scheduling</option>
              <option value="outbreak">Report Sanitation or Vector Outbreak Area</option>
              <option value="general">Telemedicine Consultation & General Health Check</option>
            </Select>
          </FormGroup>

          <div className="bg-slate-50 dark:bg-slate-900/40 border border-border-subtle rounded-xl p-3 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${activeProf.avatarColor} text-white font-bold flex items-center justify-center shrink-0`}>
              {activeProf.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold">Assigned Lead Officer</span>
              <div className="flex items-center justify-between mt-0.5">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeProf.name}</h5>
                <span className="text-[10px] font-black text-amber-500">{activeProf.rating}</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-none">{activeProf.role} • {activeProf.dept}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Patient / Reporter Name" required>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </FormGroup>

            <FormGroup label="Contact Mobile Number" required>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </FormGroup>
          </div>

          <FormGroup label="Patient / Case Location" required>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9 h-10 text-xs"
                required
              />
            </div>
          </FormGroup>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Target Date" required>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-xs"
                required
              />
            </FormGroup>

            <FormGroup label="Target Time" required>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-10 text-xs"
                required
              />
            </FormGroup>
          </div>

          <FormGroup label="Symptom Details / Case Notes / Report Info">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide details of symptoms, medical emergencies, or environmental issues..."
              className="text-xs min-h-[70px] resize-none"
            />
          </FormGroup>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-med-green hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
          >
            {isSubmitting ? 'Registering Telemetry Case...' : 'Submit Healthcare Case Request'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
