import React, { useState } from 'react';
import { Plus, Link as LinkIcon, AlertCircle, Video } from 'lucide-react';
import { Button } from './Button';
import { Category } from '../types';

interface SubmissionFormProps {
  onSubmit: (url: string, caption: string, author: string, category: Category) => void;
  categories: Category[];
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, categories }) => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<Category>(categories[0] || 'mizah');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!categories.includes(category) && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    const trimmedCaption = caption.trim();
    const trimmedAuthor = author.trim();

    // Basic Twitter/X URL validation
    const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+/;
    
    if (!twitterRegex.test(trimmedUrl)) {
      setError("Lütfen geçerli bir Twitter (X) linki girin.");
      return;
    }

    if (!trimmedCaption) {
      setError("Bir başlık veya açıklama yazmalısın.");
      return;
    }

    const normalizedAuthor = trimmedAuthor.replace(/^@+/, '') || 'Anonim Editor';

    onSubmit(trimmedUrl, trimmedCaption, normalizedAuthor, category);
    setUrl('');
    setCaption('');
    setAuthor('');
    setCategory('mizah');
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden">
      {/* Glossy sheen effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

      <h2 className="text-2xl font-bold mb-6 flex items-center text-white relative z-10">
        <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
            <Video className="w-5 h-5 text-blue-400" />
        </div>
        Video Edit Ekle
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Tweet (Video) Linki</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://x.com/username/status/..."
              className="block w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 ml-1">*Videolu tweet linki yapıştırırsanız otomatik olarak oynatıcı formatında yüklenir.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Başlık / Yorumun</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Bu edit neden efsane?..."
              maxLength={60}
              className="block w-full px-5 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Editör Adı (Opsiyonel)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="@kullanici"
              maxLength={20}
              className="block w-full px-5 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Kategori</label>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {(categories as Category[]).map(cat => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={category === cat ? 'primary' : 'ghost'}
                className={category === cat ? '' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}
                onClick={() => setCategory(cat)}
              >
                {cat === 'futbol' ? 'Futbol' : cat === 'basketbol' ? 'Basketbol' : cat === 'voleybol' ? 'Voleybol' : cat === 'duygusal' ? 'Duygusal' : cat === 'mizah' ? 'Mizah' : cat === 'film' ? 'Film' : 'Dizi'}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center text-red-300 text-sm bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" className="shadow-xl shadow-blue-600/20">
            Paylaş ve Oyla
          </Button>
        </div>
      </form>
    </div>
  );
};
