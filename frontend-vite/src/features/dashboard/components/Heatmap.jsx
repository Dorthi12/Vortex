export default function Heatmap() {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden relative shadow-inner border border-slate-800 h-64 sm:h-80 w-full flex items-center justify-center">
      {/* Dark Map Background Placeholder */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
      
      {/* Glowing Hotspots */}
      <div className="absolute top-[30%] left-[20%] w-12 h-12 bg-red-500 rounded-full mix-blend-screen filter blur-[10px] animate-pulse opacity-80"></div>
      <div className="absolute top-[35%] left-[22%] w-4 h-4 bg-red-400 rounded-full shadow-[0_0_15px_rgba(248,113,113,1)] z-10"></div>

      <div className="absolute top-[60%] left-[50%] w-16 h-16 bg-yellow-500 rounded-full mix-blend-screen filter blur-[15px] animate-pulse delay-75 opacity-70"></div>
      <div className="absolute top-[64%] left-[53%] w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,1)] z-10"></div>

      <div className="absolute top-[20%] right-[30%] w-20 h-20 bg-orange-500 rounded-full mix-blend-screen filter blur-[20px] animate-pulse delay-150 opacity-60"></div>
      <div className="absolute top-[25%] right-[33%] w-5 h-5 bg-orange-400 rounded-full shadow-[0_0_20px_rgba(251,146,60,1)] z-10"></div>
      
      <div className="relative z-20 text-center">
        <h3 className="text-white font-heading font-medium tracking-wide mb-1 shadow-black drop-shadow-md">Geographic Issue Heatmap</h3>
        <p className="text-xs text-slate-400">Interactive Map Visualization Placeholder</p>
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg p-2 flex items-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> High</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Med</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Low</div>
      </div>
    </div>
  );
}
