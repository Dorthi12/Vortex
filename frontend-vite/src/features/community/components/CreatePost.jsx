import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, MapPin, Smile } from 'lucide-react';

export default function CreatePost({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-heading font-bold text-primary">Create a Post</h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
                U
              </div>
              <div className="flex-grow flex flex-col">
                <span className="font-semibold text-slate-800 text-sm">Citizen User</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start mt-0.5 flex items-center gap-1">
                  Public
                </span>
              </div>
            </div>

            <textarea 
              placeholder="What do you want to share with the community?"
              className="w-full h-32 text-lg text-slate-800 placeholder-slate-400 resize-none outline-none border-none p-0 focus:ring-0"
              autoFocus
            ></textarea>

            <div className="mt-4 flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-full transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-full transition-colors">
                <MapPin className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-full transition-colors">
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-full font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-full font-medium text-white bg-primary hover:bg-primary-light shadow-md shadow-primary/20 transition-all border border-transparent"
            >
              Post
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
