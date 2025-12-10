import React, { useEffect, useRef, useState } from 'react';
import { ArrowBigUp, ArrowBigDown, Share2, PlayCircle } from 'lucide-react';
import { EditSubmission } from '../types';

interface TweetCardProps {
  edit: EditSubmission;
  rank?: number;
  onVote: (id: string, type: 'up' | 'down') => void;
  userVote?: 'up' | 'down'; // Track what the current user voted
}

// Ensure the Twitter script is only loaded once
let twitterScriptPromise: Promise<void> | null = null;
const loadTwitterScript = () => {
  if (twitterScriptPromise) return twitterScriptPromise;

  twitterScriptPromise = new Promise((resolve, reject) => {
    if ((window as any).twttr?.widgets) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
    script.setAttribute('async', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Twitter widgets script failed to load'));
    document.head.appendChild(script);
  });

  return twitterScriptPromise;
};

// Native Twitter Embed Component
const TwitterEmbed: React.FC<{ tweetId: string }> = ({ tweetId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (!isVisible) return;

    const renderTweet = async () => {
      try {
        await loadTwitterScript();
        const twttr = (window as any).twttr;
        const container = containerRef.current;
        if (isCancelled || !twttr?.widgets || !container) return;

        // Clear any existing embeds in this container to avoid doubles
        container.innerHTML = '';

        // Clamp width to Twitter widget limits so it stays responsive
        const containerWidth = container.clientWidth || 550;
        const width = Math.min(Math.max(containerWidth, 320), 550);

        // Keep space reserved while the embed renders
        container.style.minHeight = '360px';

        const run = () => twttr.widgets.createTweet(tweetId, container, {
          theme: 'dark',
          align: 'center',
          conversation: 'none',
          dnt: true,
          width,
        }).then(() => {
          container.style.minHeight = '0px';
        });

        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => !isCancelled && run());
        } else {
          run();
        }
      } catch (error) {
        console.error(error);
      }
    };

    renderTweet();

    // Cleanup to prevent duplicates on remount
    return () => {
      isCancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tweetId, isVisible]);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center tweet-container"
      style={{ minHeight: '360px' }}
    />
  );
};

export const TweetCard: React.FC<TweetCardProps> = ({ edit, rank, onVote, userVote }) => {
  const formatCategory = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1);
  
  const handleShare = async () => {
    const shareUrl = edit.tweetUrl || window.location.href;
    const shareText = `Bu edite bak: ${edit.caption}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Yılın Editi',
          text: shareText,
          url: shareUrl,
        });
        return;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link kopyalandı!');
    } catch {
      alert('Link kopyalanamadı, lütfen manuel kopyalayın.');
    }
  };

  const getVoteColor = () => {
    if (edit.votes > 0) return 'text-blue-400';
    if (edit.votes < 0) return 'text-red-400';
    return 'text-white';
  };

  return (
    <div 
      data-edit-id={edit.id}
      className="relative group bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 shadow-lg"
    >
      
      {/* Cinematic Ambient Glow behind the card */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Rank Badge for Top 3 - Smaller */}
      {rank && rank <= 3 && (
        <div className={`absolute top-0 right-0 z-10 w-14 h-14 flex items-center justify-center font-black text-xl
          ${rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
            rank === 2 ? 'bg-slate-400/20 text-slate-200 border-slate-400/30' : 
            'bg-orange-700/20 text-orange-400 border-orange-700/30'} 
          rounded-bl-[1.5rem] border-b border-l shadow-lg`}
        >
          #{rank}
        </div>
      )}

      <div className="p-0 relative z-10">
        
        {/* Header Section - More Compact */}
        <div className="p-4 pb-2">
           <div className="flex justify-between items-start pr-12">
            <div>
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 leading-tight drop-shadow-sm flex items-center">
                    <PlayCircle className="w-4 h-4 text-blue-400 mr-2 inline" />
                    {edit.caption}
                </h3>
                <div className="flex items-center space-x-2">
                    <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400">
                        Editör: <span className="text-blue-300 font-medium">{edit.author}</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400">
                        Kategori: <span className="text-amber-300 font-medium">{formatCategory(edit.category)}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Video / Tweet Embed Container - Compact Player */}
        <div className="relative w-full bg-black/80 border-y border-slate-800 shadow-inner">
          <div className="w-full max-w-[720px] mx-auto px-3 py-4">
            <TwitterEmbed tweetId={edit.tweetId} />
          </div>
        </div>

        {/* Footer Actions - Compact with Upvote/Downvote */}
        <div className="flex items-center justify-between p-3 bg-slate-900/80 border-t border-slate-800">
            
            {/* Voting Capsule */}
            <div className="flex items-center space-x-1 bg-slate-900/70 rounded-xl border border-slate-800 p-1 shadow-inner">
                <button 
                    onClick={() => onVote(edit.id, 'up')}
                    className={`p-2 rounded-lg transition-all active:scale-95 duration-200 hover:bg-white/10 group/up
                        ${userVote === 'up' ? 'text-blue-400 bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-slate-400'}`}
                    title="Beğendim (Upvote)"
                >
                    <ArrowBigUp className={`w-6 h-6 transition-colors ${userVote === 'up' ? 'fill-blue-400' : 'group-hover/up:text-blue-400'}`} />
                </button>
                
                <span className={`min-w-[40px] text-center text-xl font-black leading-none transition-colors ${getVoteColor()}`}>
                    {edit.votes}
                </span>

                <button 
                    onClick={() => onVote(edit.id, 'down')}
                    className={`p-2 rounded-lg transition-all active:scale-95 duration-200 hover:bg-white/10 group/down
                        ${userVote === 'down' ? 'text-red-400 bg-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-slate-400'}`}
                    title="Beğenmedim (Downvote)"
                >
                    <ArrowBigDown className={`w-6 h-6 transition-colors ${userVote === 'down' ? 'fill-red-400' : 'group-hover/down:text-red-400'}`} />
                </button>
            </div>

            <button 
                onClick={handleShare} 
                className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500 transition-all active:scale-95 flex items-center gap-1.5"
            >
                <span className="text-[10px] font-medium uppercase tracking-wider">Paylaş</span>
                <Share2 className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};
