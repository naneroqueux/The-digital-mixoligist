
import React from 'react';
import { CocktailProfile } from '../types';

interface CocktailCardProps {
  data: CocktailProfile;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const InfoRow: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-4 group">
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
      style={{ backgroundColor: `${color}15`, color: color }}
    >
      <i className={`ph ${icon} text-2xl`}></i>
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">{label}</span>
      <span className="text-white/90 text-sm font-medium">{value}</span>
    </div>
  </div>
);

export const CocktailCard: React.FC<CocktailCardProps> = ({ data, isFavorite = false, onToggleFavorite }) => {
  const accentColor = data.color || '#D0BCFF';

  return (
    <div className="w-full max-w-5xl mx-auto animate-m3-in relative">
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-30 w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl backdrop-blur-xl border border-white/10"
          style={{ backgroundColor: isFavorite ? '#B3261E' : 'rgba(255,255,255,0.05)' }}
        >
          <i className={`ph-fill ph-heart text-xl md:text-2xl ${isFavorite ? 'text-white' : 'text-white/40'}`}></i>
        </button>
      )}

      <div className="relative rounded-[32px] md:rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5 bg-[#1D1B20]">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }}
        ></div>

        <div className="relative z-10 p-6 md:p-16">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start lg:items-center mb-10 md:mb-16">
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                  {data.ibaClassification}
                </span>
                {data.categories && data.categories.map((cat, idx) => (
                  <span key={idx} className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-white/80 border border-white/10">
                    {cat}
                  </span>
                ))}
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-white/60">
                  {data.abv} ABV
                </span>
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-white/40">
                  {data.difficulty}
                </span>
                {data.tags && data.tags.map((tag, idx) => (
                  <span key={idx} className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 text-white/40 italic">
                    #{tag}
                  </span>
                ))}
              </div>

              <h2 className="font-display text-4xl md:text-8xl text-white font-normal tracking-tight leading-tight md:leading-none">
                {data.name}
              </h2>
              <p className="text-white/50 text-base md:text-xl font-light italic leading-relaxed max-w-xl">
                "{data.curiosity}"
              </p>
            </div>

            <div className="relative shrink-0 self-center lg:self-auto">
              <div className="absolute inset-0 blur-3xl opacity-20" style={{ backgroundColor: accentColor }}></div>
              <div className="w-56 h-56 md:w-80 md:h-80 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl relative z-10 bg-white/5 border border-white/10 flex items-center justify-center">
                {data.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={data.name}
                    className="w-full h-full object-cover animate-m3-in"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ph ph-martini text-9xl text-[#D0BCFF]/10"></i>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
            <div className="lg:col-span-7 space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                <InfoRow icon="ph-wine" label="Taça" value={data.glassware} color={accentColor} />
                <InfoRow icon="ph-flask" label="Método" value={data.preparationType} color={accentColor} />
                <InfoRow icon="ph-plant" label="Guarnição" value={data.garnish} color={accentColor} />
                <InfoRow icon="ph-funnel" label="Filtragem" value={data.strainingTechnique} color={accentColor} />
              </div>

              <div className="space-y-6">
                <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Composição</h3>
                <div className="grid gap-3">
                  {data.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 md:p-5 rounded-[20px] md:rounded-3xl bg-white/[0.02] border border-white/5">
                      <span className="text-white/80 font-light text-base md:text-lg">{ing.name}</span>
                      <span className="font-medium tracking-tight px-3 md:px-4 py-1 rounded-full text-xs md:text-sm" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                        {ing.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8 md:space-y-12">
              <div className="p-8 md:p-10 rounded-[32px] md:rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">O Preparo</h3>
                <p className="text-white/90 leading-relaxed font-light text-lg md:text-xl">
                  {data.method}
                </p>
              </div>

              <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-4">
                <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Harmonização</h3>
                <p className="text-white/80 font-light leading-relaxed italic">
                  {data.pairing}
                </p>
              </div>

              <div className="space-y-6 px-4">
                <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Legado</h3>
                <p className="text-white/60 text-sm leading-relaxed font-light">
                  {data.history}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
