import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, MapPin, Target, Send, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateIssue() {
  const navigate = useNavigate();
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  const handleLocationDetect = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmit(true);
    setTimeout(() => {
      navigate('/issues');
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link to="/issues" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Issues
        </Link>
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Report a Civic Problem</h1>
        <p className="text-slate-600">Provide details about the issue to help authorities resolve it efficiently.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Issue Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none bg-slate-50 focus:bg-white"
                placeholder="E.g., Large pothole on main road"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-slate-700 bg-slate-50 focus:bg-white appearance-none">
                  <option value="">Select a category</option>
                  <option value="roads">Roads & Transport</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="sanitation">Sanitation & Waste</option>
                  <option value="health">Public Health</option>
                  <option value="water">Water Supply</option>
                  <option value="electricity">Electricity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Priority Level</label>
                <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-700 bg-slate-50 focus:bg-white appearance-none">
                  <option value="low">Low (Routine maintenance)</option>
                  <option value="medium">Medium (Requires attention)</option>
                  <option value="high">High (Safety hazard)</option>
                  <option value="critical">Critical (Immediate danger)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                required
                rows="4"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none bg-slate-50 focus:bg-white resize-y"
                placeholder="Describe the issue in detail, including exactly where it is located..."
              ></textarea>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-slate-700">Location</label>
                <button 
                  type="button" 
                  onClick={handleLocationDetect}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:text-primary-light transition-colors p-1"
                >
                  <Target className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Detecting...' : 'Auto-detect'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  defaultValue={isLocating ? 'Detecting location...' : ''}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none bg-slate-50 focus:bg-white"
                  placeholder="Enter specific address or landmark"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Photo Evidence</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Click or drag image to upload</p>
                <p className="text-xs text-slate-500">Supports JPG, PNG (Max 5MB)</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-blue-800 leading-relaxed">
              By submitting this issue, you agree that the information provided is accurate to the best of your knowledge. False reporting may lead to penalties.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmit}
              className={`flex justify-center items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${
                isSubmit ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-primary hover:bg-primary-light shadow-primary/30 hover:shadow-primary/40 active:scale-95'
              }`}
            >
              {isSubmit ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Submitted
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
