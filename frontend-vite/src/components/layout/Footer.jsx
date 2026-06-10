export default function Footer() {
  return (
    <footer className="bg-primary text-white/80 py-8 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-heading font-bold text-sm">
            N
          </div>
          <span className="font-heading font-bold text-xl text-white tracking-wide">
            NETRAVAAH
          </span>
        </div>
        
        <p className="text-sm font-light">
          &copy; {new Date().getFullYear()} NETRAVAAH Governance Platform. All rights reserved.
        </p>
        
        <div className="flex gap-4 text-sm font-light">
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
          <a href="#" className="hover:text-accent transition-colors">Terms</a>
          <a href="#" className="hover:text-accent transition-colors">Help</a>
        </div>
      </div>
    </footer>
  );
}
