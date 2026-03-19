import { useState, useRef, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const VIDEOS = [
  {
    src: "https://www.arraish.com/cdn/shop/videos/c/vp/bee2a985218d4bd09b25d0ede19d3441/bee2a985218d4bd09b25d0ede19d3441.HD-720p-1.6Mbps-40375830.mp4?v=0",
    poster: "https://c.animaapp.com/mmu1yta2SFboEj/assets/67.jpg",
  },
  {
    src: "https://www.arraish.com/cdn/shop/videos/c/vp/d362d8f4909745f08ad76661562b828e/d362d8f4909745f08ad76661562b828e.HD-1080p-7.2Mbps-40363618.mp4?v=0",
    poster: "https://c.animaapp.com/mmu1yta2SFboEj/assets/70.jpg",
  },
  {
    src: "https://www.arraish.com/cdn/shop/videos/c/vp/c6593a13d9ab4ef4acb3f68a1affc207/c6593a13d9ab4ef4acb3f68a1affc207.HD-720p-1.6Mbps-40363636.mp4?v=0",
    poster: "https://c.animaapp.com/mmu1yta2SFboEj/assets/53.jpg",
  },
  {
    src: "https://www.arraish.com/cdn/shop/videos/c/vp/48e83c7fcfb84639a269d18a6d6506aa/48e83c7fcfb84639a269d18a6d6506aa.HD-1080p-2.5Mbps-40363646.mp4?v=0",
    poster: "https://c.animaapp.com/mmu1yta2SFboEj/assets/72.jpg",
  },
];

export const VideoSection = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.05);

  // Sync dots with native scroll so swipe gestures update the indicator
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / (el.scrollWidth / VIDEOS.length));
      setActiveIndex(Math.min(Math.max(index, 0), VIDEOS.length - 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToIndex = (index: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement;
    if (!card) return;
    // scrollIntoView respects scroll-padding, avoiding a hardcoded pixel offset
    card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActiveIndex(index);
  };

  return (
    <section id="videos" className="py-16 md:py-20" >
      <div ref={ref} className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className={`text-center px-4 md:px-[50px] mb-12 md:mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <p className="text-[11px] tracking-[5px] uppercase mb-3" >
            Handcrafted in Multan
          </p>
          <h2 className="text-[26px] md:text-[34px] tracking-wide leading-tight" >
            Watch Our Craft
          </h2>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px w-16" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: 'rgba(251,191,36,0.8)' }} />
            <div className="h-px w-16" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>

        {/* Single unified layout — each video rendered once.
            Mobile (<md): horizontal snap scroll.
            Desktop (md+): staggered 4-column grid, no scroll. */}
        <div
          ref={sliderRef}
          className="flex gap-4 md:gap-5 overflow-x-auto video-slider scroll-smooth snap-x snap-mandatory md:snap-none px-4 md:px-[50px] scroll-pl-4 md:scroll-pl-0 pb-1 md:pb-0 md:items-start"
        >
          {VIDEOS.map((video, i) => (
            <div
              key={i}
              className={`shrink-0 w-[82vw] snap-start md:flex-1 md:w-auto rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl group transition-all duration-500 md:hover:scale-[1.03] md:hover:ring-amber-300/40 ${i % 2 === 1 ? 'md:mt-10' : 'md:mb-10'} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative pb-[166%] bg-sky-900/60">
                <video
                  playsInline
                  autoPlay
                  loop
                  muted
                  preload="metadata"
                  poster={video.poster}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source src={video.src} type="video/mp4" />
                  <img src={video.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </video>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                  <span className="text-white/80 text-[11px] font-medium">{i + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicators — mobile only */}
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {VIDEOS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '28px' : '6px',
                backgroundColor: i === activeIndex ? '#fbbf24' : 'rgba(255,255,255,0.25)',
              }}
              aria-label={`Go to video ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
