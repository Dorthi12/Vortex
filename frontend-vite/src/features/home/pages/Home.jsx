import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Users, LayoutDashboard } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Abstract Background using Framer Motion */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 -right-20 w-[35rem] h-[35rem] bg-primary/10 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-1/4 left-1/3 w-[45rem] h-[45rem] bg-sky-200/20 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10 pb-32">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1 px-4 rounded-full bg-primary/5 text-primary font-semibold text-sm mb-6 border border-primary/10 shadow-sm backdrop-blur-sm">
            Introducing Next-Gen Governance
          </span>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-slate-900 leading-tight mb-8">
            AI-Powered <br className="hidden md:block" />
            <span className="text-gradient">Governance Intelligence</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            NETRAVAAH empowers citizens and enables proactive governance. Report issues, participate in the community, and explore AI-driven civic insights for a better future.
          </p>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link to="/issues/new" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 group">
            <AlertCircle className="w-5 h-5" />
            Report Issue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link to="/community" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-primary border border-slate-200 px-8 py-4 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
            <Users className="w-5 h-5 text-accent" />
            Explore Community
          </Link>

          <Link to="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 glass-dark px-8 py-4 rounded-lg font-medium hover:bg-primary/95 transition-colors shadow-lg">
            <LayoutDashboard className="w-5 h-5 text-accent" />
            View Dashboard
          </Link>
        </motion.div>
      </div>
      
      {/* Decorative Bottom Wave/Line or Features Preview could go here */}
    </div>
  );
}
