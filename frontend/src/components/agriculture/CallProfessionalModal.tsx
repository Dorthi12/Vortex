'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup, Textarea } from '@/components/ui/form';
import { Phone, Calendar, User, MapPin, CheckCircle2, ShieldAlert, Award, Loader2, Sparkles } from 'lucide-react';

interface CallProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: 'soil_check' | 'pest_control' | 'subsidy_help' | 'market_advice' | 'general';
}

interface Professional {
  name: string;
  role: string;
  rating: string;
  avatarColor: string;
  dept: string;
}

const PROFESSIONALS: Record<string, Professional> = {
  soil_check: {
    name: 'Dr. Arvind Kulkarni',
    role: 'Senior Soil Scientist',
    rating: '4.9 ★ (120+ visits)',
    avatarColor: 'bg-emerald-600',
    dept: 'Division of Soil Telemetry, Pune',
  },
  pest_control: {
    name: 'Dr. Sunita Deshmukh',
    role: 'Lead IPM Entomologist',
    rating: '4.8 ★ (84+ audits)',
    avatarColor: 'bg-amber-600',
    dept: 'Integrated Pest Management Cell',
  },
  subsidy_help: {
    name: 'Mr. Ramesh Patil',
    role: 'Welfare Schemes Facilitator',
    rating: '4.9 ★ (210+ assisted)',
    avatarColor: 'bg-indigo-600',
    dept: 'Agricultural Welfare & Subsidies Dept',
  },
  market_advice: {
    name: 'Mr. Anil Gawde',
    role: 'APMC Market Intelligence Director',
    rating: '4.7 ★ (95+ consultations)',
    avatarColor: 'bg-blue-600',
    dept: 'APMC Regulatory Advisory Council',
  },
  general: {
    name: 'Dr. Vikram Joshi',
    role: 'Principal Agronomist',
    rating: '4.9 ★ (300+ consults)',
    avatarColor: 'bg-teal-600',
    dept: 'Agriculture Research Center, Maharashtra',
  },
};

export function CallProfessionalModal({
  isOpen,
  onClose,
  defaultService = 'general',
}: CallProfessionalModalProps) {
  const [service, setService] = useState<string>(defaultService);
  const [farmerName, setFarmerName] = useState<string>('Jane Doe');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [location, setLocation] = useState<string>('Sector 4B, Pune Division');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBooked, setIsBooked] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string>('');

  // Update local state when default changes
  useEffect(() => {
    setService(defaultService);
  }, [defaultService]);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API registration delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsBooked(true);
      setTicketId(`TKT-AGRI-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1500);
  };

  const resetForm = () => {
    setIsBooked(false);
    setNotes('');
    onClose();
  };

  const activeProf = PROFESSIONALS[service] || PROFESSIONALS.general;

  const modalFooter = isBooked ? (
    <Button variant="primary" onClick={resetForm} className="w-full bg-sea-green hover:bg-dark-green text-white font-bold cursor-pointer">
      Return to Dashboard
    </Button>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBooked ? "Booking Confirmed" : "Request Professional Agri-Consultation"}
      footer={modalFooter}
    >
      {isBooked ? (
        <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Confirmed Icon */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
              Appointment Scheduled Successfully!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Your request has been successfully assigned to an officer. Telemetry files have been synced.
            </p>
          </div>

          {/* Ticket ID Badge */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-border-subtle rounded-lg p-3 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Reference Case ID</span>
            <div className="text-lg font-black text-sea-green select-all mt-0.5">{ticketId}</div>
          </div>

          {/* Specialist Card */}
          <div className="border border-border-subtle rounded-xl p-4 space-y-3 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-full ${activeProf.avatarColor} text-white font-black flex items-center justify-center shadow-inner`}>
                {activeProf.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{activeProf.name}</h4>
                  <span className="inline-flex items-center text-[9px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-sm">
                    {activeProf.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5">{activeProf.dept}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-sea-green" /> Scheduled Date:
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                {date} at {time}
              </span>
            </div>
          </div>

          {/* Quick Notice Info */}
          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 rounded-lg p-3 flex gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-605 dark:text-slate-400 leading-relaxed">
              <strong>Farmer Notice:</strong> The officer will carry high-precision soil probes and crop-scanner kits. Please keep water samples and land documents ready if requested.
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Service Selector */}
          <FormGroup label="Consultation Specialty" required>
            <Select value={service} onChange={(e) => setService(e.target.value)} className="h-10 text-xs">
              <option value="soil_check">Soil & Crop Quality Testing (In-Person)</option>
              <option value="pest_control">Pest & Disease Outbreak Management (In-Person)</option>
              <option value="subsidy_help">Subsidy Program & Scheme Advisor (Call/Visit)</option>
              <option value="market_advice">APMC Mandi Valuation & Sales Counsel (Call)</option>
              <option value="general">General Agronomist Technical Guidance (Call/Visit)</option>
            </Select>
          </FormGroup>

          {/* Professional Preview */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-border-subtle rounded-xl p-3 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${activeProf.avatarColor} text-white font-bold flex items-center justify-center shrink-0`}>
              {activeProf.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold">Assigned Specialist</span>
              <div className="flex items-center justify-between mt-0.5">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeProf.name}</h5>
                <span className="text-[10px] font-black text-amber-500">{activeProf.rating}</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-none">{activeProf.role} • {activeProf.dept}</p>
            </div>
          </div>

          {/* Farmer Profile Info (Linked) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Farmer Name" required>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="pl-9 h-10 text-xs"
                  required
                />
              </div>
            </FormGroup>

            <FormGroup label="Primary Mobile No." required>
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

          <FormGroup label="Target Farm Location" required>
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

          {/* Date & Time Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Preferred Visit Date" required>
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
              </div>
            </FormGroup>

            <FormGroup label="Preferred Time Slot" required>
              <Select value={time} onChange={(e) => setTime(e.target.value)} className="h-10 text-xs">
                <option value="08:00">Early Morning (08:00 AM - 10:00 AM)</option>
                <option value="10:00">Morning Session (10:00 AM - 12:00 PM)</option>
                <option value="12:00">Midday Session (12:00 PM - 02:00 PM)</option>
                <option value="14:00">Afternoon Session (02:00 PM - 04:00 PM)</option>
                <option value="16:00">Late Afternoon (04:00 PM - 06:00 PM)</option>
              </Select>
            </FormGroup>
          </div>

          {/* Notes description */}
          <FormGroup label="Specific Farm Issues (Optional)">
            <Textarea
              placeholder="Detail any specific issues, e.g. white grub insects in sugarcane field, yellowing wheat tips, soil pH mismatch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </FormGroup>

          {/* Submission button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sea-green hover:bg-dark-green text-white font-bold h-10 flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering Booking case...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Schedule Specialist Consultation
              </>
            )}
          </Button>
        </form>
      )}
    </Modal>
  );
}
