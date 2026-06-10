'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileImage, FileVideo, Trash2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useComplaintStore } from '@/store/useComplaintStore';
import { useUiStore } from '@/store/useUiStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Textarea, Select, FormGroup } from '@/components/ui/form';

// Categories list
const CATEGORIES = [
  'Road & Infrastructure',
  'Water Supply & Drainage',
  'Solid Waste Management',
  'Electricity & Streetlights',
  'Public Health & Sanitation'
];

// Mapped Departments
const CATEGORY_TO_DEPARTMENT: Record<string, string> = {
  'Road & Infrastructure': 'Public Works Department (PWD)',
  'Water Supply & Drainage': 'Municipal Water Authority',
  'Solid Waste Management': 'Sanitation & Environment Dept',
  'Electricity & Streetlights': 'State Electricity Board',
  'Public Health & Sanitation': 'Sanitation & Environment Dept'
};

// Form schema
const complaintFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters to explain the issue properly'),
  category: z.string().min(1, 'Please select a category'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(8, 'Please provide a descriptive location (e.g. Street name, landmarks, Ward No)'),
});

type ComplaintFormValues = z.infer<typeof complaintFormSchema>;

export default function NewComplaintPage() {
  const router = useRouter();
  const { addComplaint } = useComplaintStore();
  const { setActiveTab } = useUiStore();

  // Highlight complaints menu in sidebar
  useEffect(() => {
    setActiveTab('Complaints');
  }, [setActiveTab]);

  // Mock File Upload States
  const [photoFile, setPhotoFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const [videoFile, setVideoFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: CATEGORIES[0],
      department: CATEGORY_TO_DEPARTMENT[CATEGORIES[0]],
      location: '',
    },
  });

  const selectedCategory = watch('category');

  // Automatically sync department when category changes
  useEffect(() => {
    if (selectedCategory && CATEGORY_TO_DEPARTMENT[selectedCategory]) {
      setValue('department', CATEGORY_TO_DEPARTMENT[selectedCategory]);
    }
  }, [selectedCategory, setValue]);

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setPhotoFile({
        name: file.name,
        size: `${sizeMB} MB`,
        url: URL.createObjectURL(file), // Generate local preview URL
      });
    }
  };

  // Handle Video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setVideoFile({
        name: file.name,
        size: `${sizeMB} MB`,
        url: URL.createObjectURL(file), // Generate local preview URL
      });
    }
  };

  const onSubmit = async (values: ComplaintFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Seed coordinates inside Sector 4B grid
    const coordinates = {
      x: Math.floor(15 + Math.random() * 70), // x between 15% and 85%
      y: Math.floor(15 + Math.random() * 70)  // y between 15% and 85%
    };

    addComplaint({
      title: values.title,
      description: values.description,
      category: values.category,
      department: values.department,
      location: values.location,
      coordinates,
      photoName: photoFile?.name,
      photoUrl: photoFile?.url || '/mock-media/pothole.jpg', // Seed default mock image if empty
      videoName: videoFile?.name,
      videoUrl: videoFile?.url,
    });

    setIsSubmitting(false);
    setIsSuccess(true);

    // Short success delay then redirect
    setTimeout(() => {
      router.push('/complaints');
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Complaints Link */}
      <div>
        <Link 
          href="/complaints" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-royal-blue dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Grievances List
        </Link>
      </div>

      {/* Header Area */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-royal-blue dark:text-brand-yellow font-bold">Register Grievance</span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">File Public Complaint</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-1">
          Submit local municipal infrastructure defects, public sanitation concerns, or utility outage issues.
        </p>
      </div>

      {isSuccess ? (
        <Card className="bg-card border-success/30 shadow-xs border-t-4 border-t-success">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-success-light dark:bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Grievance Registered Successfully</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-md mx-auto">
                Your complaint has been logged and queued for technical officer dispatch. Redirecting you to the active monitoring list...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border-subtle shadow-md">
          <CardHeader className="pb-4 border-b border-border-subtle">
            <CardTitle className="text-base font-bold">Incident Reporting Form</CardTitle>
            <CardDescription className="text-xs">
              All submissions are logged under the Municipal SLA tracking rules and monitored by citizen dashboard operators.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Category & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup 
                  label="Complaint Category" 
                  errorText={errors.category?.message} 
                  required
                >
                  <Select 
                    {...register('category')} 
                    error={!!errors.category}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup 
                  label="Routed Department (Auto-Mapped)" 
                  errorText={errors.department?.message}
                >
                  <Input 
                    {...register('department')} 
                    disabled 
                    className="bg-slate-50 dark:bg-slate-900/60 font-semibold cursor-not-allowed opacity-80"
                  />
                </FormGroup>
              </div>

              {/* Title */}
              <FormGroup 
                label="Complaint Title" 
                helperText="Provide a brief, clear summary of the issue (e.g., 'Broken streetlight near gate 3')" 
                errorText={errors.title?.message} 
                required
              >
                <Input 
                  {...register('title')} 
                  placeholder="Summarize the incident..." 
                  error={!!errors.title}
                />
              </FormGroup>

              {/* Description */}
              <FormGroup 
                label="Detailed Description" 
                helperText="Explain the civic issue, specify what is affected, and note any safety hazards." 
                errorText={errors.description?.message} 
                required
              >
                <Textarea 
                  {...register('description')} 
                  placeholder="Provide precise details of the occurrence..." 
                  className="min-h-[120px]"
                  error={!!errors.description}
                />
              </FormGroup>

              {/* Location */}
              <FormGroup 
                label="Incident Location" 
                helperText="Indicate ward, street name, lane, and nearby physical landmarks." 
                errorText={errors.location?.message} 
                required
              >
                <Input 
                  {...register('location')} 
                  placeholder="e.g. Sector 4B Lane 4, opposite Community Park" 
                  error={!!errors.location}
                />
              </FormGroup>

              {/* Media Uploads */}
              <div className="space-y-4 pt-2 border-t border-border-subtle">
                <Label className="text-sm font-semibold">Evidence Attachments (Optional)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Photo Upload Box */}
                  <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors flex flex-col items-center justify-center min-h-[110px] text-center">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {photoFile ? (
                      <div className="space-y-2 z-10 w-full">
                        <div className="flex items-center justify-center gap-2 text-royal-blue dark:text-blue-400">
                          <FileImage className="w-5 h-5" />
                          <span className="text-xs font-bold truncate max-w-[200px]">{photoFile.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">{photoFile.size}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setPhotoFile(null);
                          }}
                          className="h-7 px-2.5 text-danger hover:bg-danger-light/10 text-[10px] gap-1 cursor-pointer mx-auto flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Photo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pointer-events-none">
                        <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs mx-auto text-slate-500">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-350">Upload Photo Evidence</span>
                        <span className="block text-[10px] text-slate-500">Supports PNG, JPG (Max 5MB)</span>
                      </div>
                    )}
                  </div>

                  {/* Video Upload Box */}
                  <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors flex flex-col items-center justify-center min-h-[110px] text-center">
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {videoFile ? (
                      <div className="space-y-2 z-10 w-full">
                        <div className="flex items-center justify-center gap-2 text-royal-blue dark:text-blue-400">
                          <FileVideo className="w-5 h-5" />
                          <span className="text-xs font-bold truncate max-w-[200px]">{videoFile.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">{videoFile.size}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setVideoFile(null);
                          }}
                          className="h-7 px-2.5 text-danger hover:bg-danger-light/10 text-[10px] gap-1 cursor-pointer mx-auto flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Video
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pointer-events-none">
                        <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs mx-auto text-slate-500">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-350">Upload Video Footage</span>
                        <span className="block text-[10px] text-slate-500">Supports MP4, MOV (Max 20MB)</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <Link href="/complaints" passHref>
                  <Button type="button" variant="outline" className="h-10 cursor-pointer">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  variant="navy" 
                  isLoading={isSubmitting} 
                  className="h-10 px-6 cursor-pointer"
                >
                  File Complaint
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
