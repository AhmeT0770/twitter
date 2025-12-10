import React from 'react';
import { Trophy, Flame, TrendingUp } from 'lucide-react';
import { EditSubmission } from '../types';

interface LeaderboardProps {
  edits: EditSubmission[];
  onSelect?: (edit: EditSubmission) => void;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ edits, onSelect, className = '' }) => {
  const topEdits = [...edits].sort((a, b) => b.votes - a.votes).slice(0, 5);
  const formatAuthor = (author: string) => {
    const cleanAuthor = author.trim() || 'Anonim Editor';
    return cleanAuthor.startsWith('@') ? cleanAuthor : `@${cleanAuthor}`;
  };
  const formatCategory = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1);

  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sticky top-28 shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2 drop-shadow-md" />
          Liderlik Tablosu
        </h2>
        <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      </div>

      <div className="space-y-3">
        {topEdits.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Henüz oylama verisi yok.
          </div>
        ) : (
          topEdits.map((edit, index) => (
            <div key={edit.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelect?.(edit)}
                className="w-full text-left flex items-center space-x-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all hover:translate-x-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className={`
                  flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl font-bold text-sm shadow-lg
                  ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900' : 
                    index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900' : 
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 
                    'bg-slate-700/50 text-slate-300 border border-white/10'}
                `}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">{edit.caption}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400 truncate">{formatAuthor(edit.author)}</p>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-amber-200">
                      {formatCategory(edit.category)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-blue-300 text-sm font-bold bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                  {index === 0 && <Flame className="w-3 h-3 mr-1 text-orange-500" />}
                  {edit.votes}
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-center text-xs text-slate-400 space-x-2 opacity-70">
            <TrendingUp className="w-3 h-3" />
            <span>Canlı güncelleniyor</span>
        </div>
      </div>
    </div>
  );
};
