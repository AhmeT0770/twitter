import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Hash, MessageSquare, Menu, X, Sparkles, Trash2 } from 'lucide-react';
import { EditSubmission, SortOption, Category } from './types';
import { SubmissionForm } from './components/SubmissionForm';
import { TweetCard } from './components/TweetCard';
import { Leaderboard } from './components/Leaderboard';
import { Button } from './components/Button';

const ADMIN_PASSWORD = 'yilin-editi-2025';
const BASE_CATEGORIES: Category[] = ['futbol', 'basketbol', 'voleybol', 'duygusal', 'mizah', 'film', 'dizi'];
const normalizeCategory = (cat: string) => cat.trim().toLowerCase();
const dedupeCategories = (cats: Category[]) => Array.from(new Set(cats.map(normalizeCategory)));

// Mock initial data so the app isn't empty on first load
const INITIAL_DATA: EditSubmission[] = [
  {
    id: '1',
    tweetUrl: 'https://twitter.com/elonmusk/status/1608273870901096454',
    tweetId: '1608273870901096454',
    caption: 'Matrix hatası gibi olay',
    category: 'mizah',
    votes: 142,
    timestamp: Date.now() - 10000000,
    author: 'MatrixFan'
  },
  {
    id: '2',
    tweetUrl: 'https://twitter.com/memes/status/1293593516040269825',
    tweetId: '1293593516040269825',
    caption: 'Bu kedi aynı ben ya',
    category: 'mizah',
    votes: 89,
    timestamp: Date.now() - 5000000,
    author: 'KediSever'
  }
];

// Type for tracking local user votes
type UserVoteMap = Record<string, 'up' | 'down'>;

function App() {
  // Global edits state (simulating database)
  const [edits, setEdits] = useState<EditSubmission[]>(() => {
    const saved = localStorage.getItem('twitter_edits_v1');
    const parsed: EditSubmission[] | null = saved ? JSON.parse(saved) : null;
    const withCategory = (parsed ?? INITIAL_DATA).map(edit => ({
      ...edit,
      category: (edit as any).category ?? 'mizah'
    })) as EditSubmission[];
    return withCategory;
  });

  // Local user votes state (simulating user session)
  const [myVotes, setMyVotes] = useState<UserVoteMap>(() => {
    const saved = localStorage.getItem('twitter_edits_my_votes_v1');
    return saved ? JSON.parse(saved) : {};
  });

  const [sortOption, setSortOption] = useState<SortOption>('trending');
  const [selectedCategory, setSelectedCategory] = useState<'all' | Category>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('twitter_edits_categories_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return dedupeCategories([...BASE_CATEGORIES, ...parsed]);
        }
      } catch {
        // ignore
      }
    }
    return dedupeCategories(BASE_CATEGORIES);
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => {
    // gizli kısayol: Ctrl+Shift+A ile şifre iste
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        handleSecretAccess();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Persist global data
  useEffect(() => {
    localStorage.setItem('twitter_edits_v1', JSON.stringify(edits));
  }, [edits]);

  // Persist user votes
  useEffect(() => {
    localStorage.setItem('twitter_edits_my_votes_v1', JSON.stringify(myVotes));
  }, [myVotes]);

  // Persist categories
  useEffect(() => {
    localStorage.setItem('twitter_edits_categories_v1', JSON.stringify(categories));
  }, [categories]);

  // Merge categories from edits to ensure all used categories appear
  useEffect(() => {
    const fromEdits = dedupeCategories(edits.map(e => e.category));
    setCategories(prev => dedupeCategories([...prev, ...fromEdits, ...BASE_CATEGORIES]));
  }, [edits]);

  const extractTweetId = (url: string): string | null => {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleSubmission = (url: string, caption: string, author: string, category: Category) => {
    const normalizedUrl = url.trim();
    const normalizedCaption = caption.trim();
    const normalizedAuthor = author.trim().replace(/^@+/, '') || 'Anonim Editor';

    const tweetId = extractTweetId(normalizedUrl);
    if (!tweetId) {
      alert('Tweet bağlantısı çözülemedi.');
      return;
    }

    if (!normalizedCaption) {
      alert('Başlık boş bırakılamaz.');
      return;
    }

    // Check for duplicates
    if (edits.some(e => e.tweetId === tweetId)) {
      alert('Bu tweet zaten eklenmiş!');
      return;
    }

    const newEdit: EditSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      tweetUrl: normalizedUrl,
      tweetId,
      caption: normalizedCaption,
      category,
      votes: 0,
      timestamp: Date.now(),
      author: normalizedAuthor
    };

    setEdits(prev => [newEdit, ...prev]);
  };

  const scrollToEdit = (id: string) => {
    const tryScroll = (attempts: number) => {
      const node = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        node.classList.add('outline', 'outline-2', 'outline-blue-400', 'outline-offset-2');
        setTimeout(() => {
          node.classList.remove('outline', 'outline-2', 'outline-blue-400', 'outline-offset-2');
        }, 1200);
        return;
      }
      if (attempts > 0) {
        setTimeout(() => tryScroll(attempts - 1), 80);
      }
    };
    tryScroll(8);
  };

  const handleSelectFromLeaderboard = (edit: EditSubmission) => {
    setIsAdminView(false);
    if (selectedCategory !== 'all' && selectedCategory !== edit.category) {
      setSelectedCategory(edit.category);
    }
    requestAnimationFrame(() => scrollToEdit(edit.id));
  };

  const handleVote = (id: string, type: 'up' | 'down') => {
    const currentVote = myVotes[id]; // 'up', 'down', or undefined
    let scoreChange = 0;
    let newVoteState: 'up' | 'down' | undefined = type;

    if (currentVote === type) {
      // Same button toggles off
      scoreChange = type === 'up' ? -1 : 1;
      newVoteState = undefined;
    } else if (currentVote) {
      // Switching sides now clears the previous vote only (no double step)
      scoreChange = currentVote === 'up' ? -1 : 1;
      newVoteState = undefined;
    } else {
      // Fresh vote
      scoreChange = type === 'up' ? 1 : -1;
    }

    // Update global score
    setEdits(prev => prev.map(edit => {
      if (edit.id === id) {
        return { ...edit, votes: edit.votes + scoreChange };
      }
      return edit;
    }));

    // Update local user voting history
    setMyVotes(prev => {
      const updated = { ...prev };
      if (newVoteState) {
        updated[id] = newVoteState;
      } else {
        delete updated[id];
      }
      return updated;
    });
  };

  const filteredEdits = useMemo(() => {
    if (selectedCategory === 'all') return edits;
    return edits.filter(edit => edit.category === selectedCategory);
  }, [edits, selectedCategory]);

  // Sorting Logic
  const sortedEdits = useMemo(() => {
    return [...filteredEdits].sort((a, b) => {
      if (sortOption === 'trending' || sortOption === 'top') {
        return b.votes - a.votes;
      }
      // newest
      return b.timestamp - a.timestamp;
    });
  }, [filteredEdits, sortOption]);

  const adminList = [...edits].sort((a, b) => b.timestamp - a.timestamp);
  const formatDate = (ts: number) => new Date(ts).toLocaleString('tr-TR');
  const formatCategory = (cat: Category) => cat.charAt(0).toUpperCase() + cat.slice(1);

  const handleSecretAccess = () => {
    const input = window.prompt('Kontrol paneli şifresi?');
    if (!input) return;
    if (input === ADMIN_PASSWORD) {
      setIsAdminAuthorized(true);
      setIsAdminView(true);
    } else {
      alert('Yanlış şifre.');
    }
  };

  const handleAdminToggle = () => {
    if (!isAdminAuthorized) {
      handleSecretAccess();
      return;
    }
    setIsAdminView(prev => !prev);
  };

  useEffect(() => {
    if (!isAdminAuthorized && isAdminView) {
      setIsAdminView(false);
    }
  }, [isAdminAuthorized, isAdminView]);

  const handleDelete = (id: string) => {
    const target = edits.find(e => e.id === id);
    if (!target) return;
    const confirmed = window.confirm(`“${target.caption}” kaydını silmek istediğine emin misin?`);
    if (!confirmed) return;

    setEdits(prev => prev.filter(edit => edit.id !== id));
    setMyVotes(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleAdminCategoryChange = (id: string, category: Category) => {
    setEdits(prev => prev.map(edit => edit.id === id ? { ...edit, category } : edit));
  };

  const handleAddCategory = () => {
    const normalized = normalizeCategory(newCategoryInput);
    if (!normalized) return;
    if (categories.some(cat => cat.toLowerCase() === normalized)) {
      alert('Bu kategori zaten var.');
      return;
    }
    setCategories(prev => dedupeCategories([...prev, normalized]));
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: Category) => {
    setCategories(prev => prev.filter(c => normalizeCategory(c) !== normalizeCategory(cat)));
    if (normalizeCategory(selectedCategory) === normalizeCategory(cat)) {
      setSelectedCategory('all');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-slate-950">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center space-x-3"
              onDoubleClick={handleSecretAccess}
              title=" "
            >
              <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 drop-shadow-sm">
                Yılın Editi
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-slate-300 hover:text-white transition-colors font-medium hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Kurallar</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors font-medium hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Hakkında</a>
              {isAdminAuthorized && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAdminToggle}
                >
                  {isAdminView ? 'Ana Sayfa' : 'Kontrol'}
                </Button>
              )}
              <Button variant="secondary" size="sm" icon={<MessageSquare className="w-4 h-4" />}>
                Geri Bildirim
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-4">
            <a href="#" className="block text-slate-300 hover:text-white">Kurallar</a>
            <a href="#" className="block text-slate-300 hover:text-white">Hakkında</a>
            {isAdminAuthorized && (
              <button
                onClick={() => {
                  handleAdminToggle();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left text-slate-300 hover:text-white"
              >
                {isAdminView ? 'Ana Sayfa' : 'Kontrol'}
              </button>
            )}
            <button
              className="w-full text-left text-slate-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Geri Bildirim
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {isAdminAuthorized && isAdminView ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Yüklenenleri Kontrol Et</h2>
                <p className="text-slate-400 text-sm">Toplam {adminList.length} kayıt</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsAdminView(false)}>Ana sayfaya dön</Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Yeni kategori ekle"
                className="w-full md:w-72 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" size="sm" onClick={handleAddCategory}>Kategori Ekle</Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-sm text-slate-200">
                  <span>{formatCategory(cat)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-red-300 hover:text-red-200 text-xs"
                    aria-label={`${cat} kategorisini sil`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {adminList.length === 0 ? (
              <div className="text-center py-16 text-slate-400">Henüz kayıt yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="text-slate-300 border-b border-white/10">
                    <tr>
                      <th className="py-3 pr-4 font-semibold">Başlık</th>
                      <th className="py-3 pr-4 font-semibold">Tweet ID</th>
                      <th className="py-3 pr-4 font-semibold">Kategori</th>
                      <th className="py-3 pr-4 font-semibold">Editör</th>
                      <th className="py-3 pr-4 font-semibold">Oy</th>
                      <th className="py-3 pr-4 font-semibold">Eklenme</th>
                      <th className="py-3 pr-4 font-semibold">Link</th>
                      <th className="py-3 pr-4 font-semibold text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminList.map(edit => (
                      <tr key={edit.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-4 text-white max-w-[240px] truncate" title={edit.caption}>{edit.caption}</td>
                        <td className="py-3 pr-4 text-slate-300">{edit.tweetId}</td>
                        <td className="py-3 pr-4 text-slate-300">
                          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                            <span>{formatCategory(edit.category)}</span>
                            <select
                              value={edit.category}
                              onChange={(e) => handleAdminCategoryChange(edit.id, e.target.value as Category)}
                              className="bg-white text-black text-xs border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              {categories.map(cat => (
                                <option className="text-black" key={cat} value={cat}>{formatCategory(cat)}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">@{edit.author}</td>
                        <td className="py-3 pr-4 text-blue-300 font-semibold">{edit.votes}</td>
                        <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{formatDate(edit.timestamp)}</td>
                        <td className="py-3 pr-4">
                          <a 
                            href={edit.tweetUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-blue-300 hover:text-blue-200 underline"
                          >
                            Aç
                          </a>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Button 
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(edit.id)}
                            className="px-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Feed */}
          <div className="lg:col-span-8">
            
            {/* Hero Section */}
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                En İyi Editleri Oyla <span className="inline-block animate-bounce">👇</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
                Twitter aleminin en komik, en yetenekli editlerini seçiyoruz. <br className="hidden md:block"/>
                Linki yapıştır, yarışmaya katıl, efsane ol.
              </p>
            </div>

            <SubmissionForm onSubmit={handleSubmission} categories={categories} />

            {/* Filters */}
            <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2 scrollbar-hide px-1">
              <Button
                variant={sortOption === 'trending' ? 'primary' : 'ghost'}
                onClick={() => setSortOption('trending')}
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                className={sortOption === 'trending' ? '' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}
              >
                Popüler
              </Button>
              <Button
                variant={sortOption === 'newest' ? 'primary' : 'ghost'}
                onClick={() => setSortOption('newest')}
                size="sm"
                icon={<Hash className="w-4 h-4" />}
                className={sortOption === 'newest' ? '' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}
              >
                En Yeni
              </Button>
            </div>
              <div className="flex items-center space-x-3 mb-8 overflow-x-auto pb-2 scrollbar-hide px-1">
              {[{ key: 'all', label: 'Hepsi' }, ...categories.map(cat => ({ key: cat, label: formatCategory(cat) }))].map(opt => (
                <Button
                  key={opt.key}
                  variant={selectedCategory === opt.key ? 'primary' : 'ghost'}
                  onClick={() => setSelectedCategory(opt.key as 'all' | Category)}
                  size="sm"
                  className={selectedCategory === opt.key ? '' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Tweet Grid */}
            <div className="grid grid-cols-1 gap-8">
              {sortedEdits.length === 0 ? (
                <div className="text-center py-24 bg-slate-900/70 rounded-3xl border border-slate-800 border-dashed">
                  <p className="text-slate-400 text-lg">Henüz hiç edit eklenmemiş. <br/>İlk sen ol, sahne senin!</p>
                </div>
              ) : (
                sortedEdits.map((edit, index) => (
                  <TweetCard
                    key={edit.id}
                    edit={edit}
                    rank={index + 1}
                    onVote={handleVote}
                    userVote={myVotes[edit.id]} // Pass the user's current vote
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Leaderboard edits={edits} onSelect={handleSelectFromLeaderboard} />
            
            {/* Info Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="font-bold text-xl text-white mb-4 flex items-center">
                Nasıl Çalışır?
              </h3>
              <ul className="text-sm text-slate-200 space-y-3 list-disc list-inside">
                <li>Twitter (X) linkini kopyala</li>
                <li>Yukarıdaki kutucuğa yapıştır</li>
                <li>Kısa ve öz bir açıklama yaz</li>
                <li>Topluluk oylarıyla sıralamaya gir!</li>
              </ul>
            </div>

            <footer className="text-center text-slate-500 text-xs py-4">
              <p>&copy;2025 Yılın Editi. Twitter (X) ile resmi bir bağlantısı yoktur.</p>
            </footer>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
