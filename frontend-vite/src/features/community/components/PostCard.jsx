import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';

export default function PostCard({ post, index }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${post.avatar === 'AI' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-primary to-primary-light'}`}>
            {post.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              {post.author}
              {post.avatar === 'AI' && (
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Verified bot</span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{post.role} • {post.time}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-primary transition-colors p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-slate-700 mb-5 leading-relaxed text-[15px]">{post.content}</p>
      
      <div className="flex items-center gap-6 text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <button className="hover:text-primary hover:bg-primary/5 p-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium text-sm">
            <ThumbsUp className="w-4 h-4" /> 
            <span>{post.upvotes}</span>
          </button>
          <button className="hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
        <button className="hover:text-primary hover:bg-primary/5 p-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium text-sm">
          <MessageSquare className="w-4 h-4" /> 
          <span>{post.comments}</span>
        </button>
        <button className="hover:text-primary hover:bg-primary/5 p-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium text-sm ml-auto">
          <Share2 className="w-4 h-4" /> 
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </motion.div>
  );
}
