'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SaaSNavbar } from '@/components/SaaSNavbar';
import { useI18n } from '@/components/I18nProvider';
import { getLikes } from '@/lib/likes';
import { getCardTitle } from '@/lib/i18n';
import promptsData from '@/data/prompts.json';

interface PromptItem {
  id: string;
  title: string;
  image: string;
  liked: boolean;
}

const BASE_PATH = '/prompt-gallery-saas';

export default function LeaderboardPage() {
  const { locale } = useI18n();
  const [ranked, setRanked] = useState<PromptItem[]>([]);
  const [isLiked, setIsLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const likedIds = new Set(getLikes().map(String));

    // Build ranked list: liked prompts first (sorted naturally), then unliked
    const all: PromptItem[] = promptsData
      .filter((p: any) => p.image && p.image.trim() !== '')
      .map((p: any) => ({
        id: String(p.id),
        title: getCardTitle(p.id, p.title, locale),
        image: p.image,
        liked: likedIds.has(String(p.id)),
      }));

    // Sort: liked first (by ID order), then unliked (by ID order)
    all.sort((a, b) => {
      if (a.liked !== b.liked) return a.liked ? -1 : 1;
      return Number(a.id) - Number(b.id);
    });

    setRanked(all.slice(0, 10));
    setIsLiked(likedIds);

    // Listen for like changes
    const handler = () => {
      const newLiked = new Set(getLikes().map(String));
      setIsLiked(newLiked);
      const updated = all.map(item => ({
        ...item,
        liked: newLiked.has(item.id),
      }));
      updated.sort((a, b) => {
        if (a.liked !== b.liked) return a.liked ? -1 : 1;
        return Number(a.id) - Number(b.id);
      });
      setRanked(updated.slice(0, 10));
    };
    window.addEventListener('likes-change', handler);
    return () => window.removeEventListener('likes-change', handler);
  }, [locale]);

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'from-amber-400/20 via-yellow-500/10 to-amber-600/20 border-amber-500/30';
      case 2: return 'from-zinc-300/10 via-zinc-400/5 to-zinc-500/10 border-zinc-400/20';
      case 3: return 'from-amber-700/10 via-orange-600/5 to-amber-800/10 border-amber-600/20';
      default: return 'from-zinc-800/30 to-zinc-900/30 border-zinc-800';
    }
  };

  const getResolvedSrc = (image: string) => {
    return image.startsWith('/') ? `${BASE_PATH}${image}` : image;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <SaaSNavbar />
      <main id="main-content" className="pt-36 pb-20 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Top prompts ranked by your likes. Tap ❤️ on any prompt to move it up the board.
          </p>
          <p className="text-[10px] text-zinc-600 mt-2">
            ⚡ In this demo, rankings reflect your personal likes. A real backend would show community-wide stats.
          </p>
        </div>

        {/* Top 10 List */}
        <div className="space-y-3">
          {ranked.map((item, index) => {
            const rank = index + 1;
            const medal = getMedal(rank);

            return (
              <Link
                key={item.id}
                href={`/prompt/${item.id}`}
                className={`block relative p-[1px] rounded-2xl bg-gradient-to-br ${getRankStyle(rank)} transition-all duration-300 hover:scale-[1.01] active:scale-98`}
              >
                <div className="relative bg-zinc-900 rounded-2xl p-4 flex items-center gap-4">
                  {/* Rank badge */}
                  <div className="flex-shrink-0 w-10 text-center">
                    {medal ? (
                      <span className="text-3xl">{medal}</span>
                    ) : (
                      <span className={`text-lg font-extrabold ${
                        item.liked ? 'text-indigo-400' : 'text-zinc-600'
                      }`}>
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-zinc-800">
                    <img
                      src={getResolvedSrc(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      Prompt #{item.id}
                    </p>
                  </div>

                  {/* Like count */}
                  <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/50">
                    <span className={item.liked ? 'text-red-400' : 'text-zinc-600'}>
                      ❤️
                    </span>
                    <span className={`text-sm font-bold ${item.liked ? 'text-red-400' : 'text-zinc-500'}`}>
                      {item.liked ? '1' : '0'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state (rare, since prompts exist) */}
        {ranked.length === 0 && (
          <div className="text-center py-24">
            <span className="text-6xl block mb-4">📊</span>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">No prompts to rank</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Prompts will appear here once they have images and you start interacting.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
