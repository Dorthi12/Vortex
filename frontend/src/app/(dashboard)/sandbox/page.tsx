'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Send, 
  Sliders, 
  Play, 
  HelpCircle, 
  Settings2, 
  Check, 
  ShieldAlert, 
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Label, Input, Textarea, Select, FormGroup } from '@/components/ui/form';

export default function DesignSystemSandbox() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formInputs, setFormInputs] = useState({
    title: '',
    sector: 'Infrastructure',
    description: '',
    severity: 'Medium'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormInputs({
      ...formInputs,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setIsModalOpen(false);
      // Clear form inputs
      setFormInputs({
        title: '',
        sector: 'Infrastructure',
        description: '',
        severity: 'Medium'
      });
    }, 1500);
  };

  // Mock table data for Digital Twin simulations
  const mockSimulations = [
    { id: 'SIM-091', sector: 'Water Supply', accuracy: '98.4%', status: 'Stable', date: '2026-06-10' },
    { id: 'SIM-092', sector: 'Power Grid', accuracy: '94.2%', status: 'At Risk', date: '2026-06-09' },
    { id: 'SIM-093', sector: 'Transportation', accuracy: '89.7%', status: 'Congested', date: '2026-06-09' },
    { id: 'SIM-094', sector: 'Waste Management', accuracy: '97.1%', status: 'Stable', date: '2026-06-08' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gov-navy text-neutral-white p-6 md:p-8 shadow-md border border-slate-800">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-royal-blue/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[25rem] h-[25rem] bg-persian-blue/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-blue/20 text-royal-blue-light border border-royal-blue/30 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            Governance Intelligence Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight">
            NETRAVAAH Design System & Shell
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Welcome to the foundational workspace. This sandbox showcases our customized UI systems, colors, typography, and interactive components. Everything is responsive, keyboard accessible, and ready for deployment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* SECTION 1: BUTTON SYSTEM */}
        <Card>
          <CardHeader>
            <CardTitle>Button System</CardTitle>
            <CardDescription>Different style variants, colors, and sizing configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Core colors */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-muted">Brand Colors</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Royal Blue (Primary)</Button>
                <Button variant="navy">Gov Navy</Button>
                <Button variant="persian">Persian Blue</Button>
                <Button variant="secondary">Secondary</Button>
              </div>
            </div>

            {/* Standard actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-muted">Standard UI Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost hover</Button>
                <Button variant="link">Link Style</Button>
              </div>
            </div>

            {/* Statuses */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-muted">Status Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="info">Info</Button>
              </div>
            </div>

            {/* Sizing & States */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-muted">Sizing & States</h4>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="navy" size="sm">Small size</Button>
                <Button variant="navy" size="md">Medium size</Button>
                <Button variant="navy" size="lg">Large size</Button>
                <Button variant="primary" size="icon" aria-label="Add project">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="primary" isLoading>Processing</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: CARD VARIATIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Card System</CardTitle>
            <CardDescription>Container boxes styled with glassmorphism, accent bars, and elevation.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Standard Elevated Card */}
            <Card hoverable className="p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-royal-blue tracking-widest">Elevated Card</span>
              <h4 className="text-sm font-semibold">Interactive Hover</h4>
              <p className="text-xs text-neutral-text-muted leading-relaxed">
                Subtle zoom and drop-shadow animation on hover. Useful for dashboard widgets.
              </p>
            </Card>

            {/* Glassmorphism Panel Card */}
            <Card glass className="p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-persian-blue tracking-widest">Glassmorphic</span>
              <h4 className="text-sm font-semibold">Blur Backdrop</h4>
              <p className="text-xs text-neutral-text-muted leading-relaxed">
                Applies a premium glass backdrop filter. Blends elegantly with dark & light modes.
              </p>
            </Card>

            {/* Accent Border Cards */}
            <Card accentBorder="left" accentColor="warning" className="p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-warning tracking-widest">Alert Left Accent</span>
              <h4 className="text-sm font-semibold">Warning Notification</h4>
              <p className="text-xs text-neutral-text-muted leading-relaxed">
                Coloured left border accent. Perfect for system alerts or pending decisions.
              </p>
            </Card>

            <Card accentBorder="top" accentColor="navy" className="p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-gov-navy tracking-widest">Top Accent Bar</span>
              <h4 className="text-sm font-semibold">Council Board</h4>
              <p className="text-xs text-neutral-text-muted leading-relaxed">
                Coloured top border block. Elegant formatting for structured reports.
              </p>
            </Card>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* SECTION 3: ALERT STATUS PANELS */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold font-sans tracking-tight text-neutral-text dark:text-neutral-white">
              Status Alerts
            </h2>
            <p className="text-xs text-neutral-text-muted">
              Callout notices for notifications and errors.
            </p>
          </div>

          <div className="space-y-3">
            <Alert variant="success" title="Model Deployed">
              Policy audit model v1.4 has compiled successfully.
            </Alert>
            
            <Alert variant="warning" title="Approaching Limit">
              CPU memory load at 82% on simulation core 4.
            </Alert>

            <Alert variant="danger" title="Validation Failed">
              Complaints API sync rejected: Invalid token key.
            </Alert>

            <Alert variant="info" title="System Notice">
              Backup sync completed 10 minutes ago.
            </Alert>
          </div>
        </div>

        {/* SECTION 4: TABLE SYSTEM */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold font-sans tracking-tight text-neutral-text dark:text-neutral-white">
                Table & Grid System
              </h2>
              <p className="text-xs text-neutral-text-muted">
                Digital Twin simulation states and predictive reliability.
              </p>
            </div>
            
            {/* Modal Trigger Button */}
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              File Incident Report
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Simulation ID</TableHead>
                <TableHead>Target Sector</TableHead>
                <TableHead>Confidence Accuracy</TableHead>
                <TableHead>Status State</TableHead>
                <TableHead>Date Logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSimulations.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell className="font-mono font-bold text-royal-blue dark:text-persian-blue">
                    {sim.id}
                  </TableCell>
                  <TableCell>{sim.sector}</TableCell>
                  <TableCell>{sim.accuracy}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      sim.status === 'Stable' 
                        ? 'bg-success-light border-success/30 text-success dark:bg-success/10' 
                        : sim.status === 'At Risk'
                          ? 'bg-danger-light border-danger/30 text-danger dark:bg-danger/10'
                          : 'bg-warning-light border-warning/30 text-warning dark:bg-warning/10'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        sim.status === 'Stable' 
                          ? 'bg-success' 
                          : sim.status === 'At Risk' 
                            ? 'bg-danger' 
                            : 'bg-warning'
                      }`} />
                      {sim.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-text-muted text-xs">{sim.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* SECTION 5: MODAL & FORM DEMO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Incident Report"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="navy" onClick={handleFormSubmit} isLoading={formSubmitted}>
              {formSubmitted ? 'Saving...' : 'Submit Report'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formSubmitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
              <div className="h-12 w-12 rounded-full bg-success/20 border border-success/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-success" />
              </div>
              <h4 className="text-base font-bold">Report Filed Successfully</h4>
              <p className="text-xs text-neutral-text-muted max-w-xs">
                Incident logs have been synchronized. The Governance Council has been notified.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 p-3 bg-info-light border border-info/30 rounded-md text-xs text-info dark:bg-info/10">
                <Info className="w-4 h-4 shrink-0" />
                <span>All incident reports undergo automated validation using NETRAVAAH AI pipelines.</span>
              </div>

              {/* Title input */}
              <FormGroup label="Incident Title" required helperText="Provide a brief summary header of the incident.">
                <Input
                  name="title"
                  value={formInputs.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Pipeline leakage detection failure"
                  required
                />
              </FormGroup>

              <div className="grid grid-cols-2 gap-4">
                {/* Sector Select */}
                <FormGroup label="Civic Sector" required>
                  <Select
                    name="sector"
                    value={formInputs.sector}
                    onChange={handleInputChange}
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Power Grid">Power Grid</option>
                    <option value="Health Services">Health Services</option>
                  </Select>
                </FormGroup>

                {/* Severity Dropdown */}
                <FormGroup label="Severity Tier" required>
                  <Select
                    name="severity"
                    value={formInputs.severity}
                    onChange={handleInputChange}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical State</option>
                  </Select>
                </FormGroup>
              </div>

              {/* Description */}
              <FormGroup label="Detailed Description" required helperText="Include exact coordinates or node ID values if possible.">
                <Textarea
                  name="description"
                  value={formInputs.description}
                  onChange={handleInputChange}
                  placeholder="Provide logs or description details..."
                  rows={4}
                  required
                />
              </FormGroup>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
