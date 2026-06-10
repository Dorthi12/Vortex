import { useState } from 'react';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { Plus } from 'lucide-react';

export default function Feed() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState([
    { 
      id: 1, 
      author: 'Dr. Vivek Sharma', 
      avatar: 'VS', 
      role: 'Civil Engineer', 
      time: '2 hours ago', 
      content: 'Noticed severe waterlogging near the MG Road junction today. The new drainage system seems to be failing under moderate rainfall. Attached are some preliminary observations.', 
      upvotes: 142, 
      comments: 24 
    },
    { 
      id: 2, 
      author: 'Priya Patel', 
      avatar: 'PP', 
      role: 'Citizen', 
      time: '5 hours ago', 
      content: 'Really impressed by the quick response from the municipality on the pothole issue I reported last week. It was fixed within 3 days! This is the kind of proactive governance we need.', 
      upvotes: 356, 
      comments: 45 
    },
    { 
      id: 3, 
      author: 'GovBot (AI)', 
      avatar: 'AI', 
      role: 'System Alert', 
      time: '12 hours ago', 
      content: 'High probability of traffic congestion detected on the Eastern Freeway between 5 PM and 7 PM. Alternative routes (Link Road) are recommended.', 
      upvotes: 89, 
      comments: 12 
    }
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold text-primary">Community Voice</h1>
        <p className="text-sm text-slate-500 hidden sm:block">Engage with citizens and officials</p>
      </div>

      <div className="space-y-6">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 lg:bottom-12 lg:right-12 w-14 h-14 bg-accent hover:bg-[#B5964D] text-white rounded-full flex items-center justify-center shadow-xl shadow-accent/30 transition-transform hover:scale-105 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreatePost isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
