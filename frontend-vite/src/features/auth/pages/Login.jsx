import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [activeTab, setActiveTab] = useState('citizen');

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 relative">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-10 right-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 left-1/4 w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/40">
          <div className="px-8 pt-8 pb-6 text-center">
            <h2 className="text-3xl font-heading font-bold text-primary mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in to continue to NETRAVAAH</p>
          </div>

          {/* Tabs */}
          <div className="flex px-8 mb-6 relative">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'citizen' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Citizen Login
              {activeTab === 'citizen' && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('gov')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'gov' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Government Login
              {activeTab === 'gov' && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-slate-200 -z-10"></div>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              <motion.form
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'citizen' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeTab === 'citizen' ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
                onSubmit={(e) => e.preventDefault()}
              >
                {activeTab === 'gov' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department ID</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white/50 transition-all text-sm outline-none"
                        placeholder="Enter Gov ID"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white/50 transition-all text-sm outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <a href="#" className="text-xs text-primary font-medium hover:text-primary-light">Forgot?</a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white/50 transition-all text-sm outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-6"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Sign In
                </motion.button>
              </motion.form>
            </AnimatePresence>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/auth" className="font-medium text-primary hover:text-accent transition-colors">
                  Sign up now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
