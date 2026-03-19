import { useEffect, useState } from 'react';
import home5 from '@/assets/images/header/home5.jpeg';

export const HeroBanner = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section id="hero">
      {/* Fixed-height container — height never grows with screen width.
          Image fills it 100% wide via absolute + object-cover. */}
      <div className="relative isolate overflow-hidden h-[260px] sm:h-[360px] md:h-[520px]">
        <img
          src={home5}
          alt="Blue Pottery of Multan"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-out ${isLoaded ? 'scale-100' : 'scale-105'}`}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 z-[1]" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />

        {/* Text overlay */}
        <div className="absolute inset-0 z-[2] flex items-center justify-center md:justify-start">
          <div className="w-full max-w-[1200px] mx-auto px-[15px] md:px-[50px]">
            <div className="text-center md:text-left max-w-[560px] mx-auto md:mx-0">
              <h2 className={`text-white text-[18px] font-bold tracking-[0.63px] leading-[1.35] sm:text-[21px] md:text-[28px] ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
                Blue Pottery of Multan: A Timeless Heritage for Modern Homes
              </h2>
              <p className={`text-white/80 text-[13px] leading-[1.8] mt-2 sm:mt-3 md:text-[15px] ${isLoaded ? 'animate-fade-in-up animate-delay-200' : 'opacity-0'}`}>
                Made for Everyday Use, Crafted with Care: Experience Authentic Blue Pottery Crockery
              </p>
              <div className={`mt-4 md:mt-5 flex justify-center md:justify-start ${isLoaded ? 'animate-fade-in-up animate-delay-400' : 'opacity-0'}`}>
                <a
                  href="#new-arrivals"
                  className="inline-flex items-center justify-center text-white text-[15px] tracking-[1px] leading-[18px] min-h-[44px] px-[28px] rounded-[7px] transition-colors duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  Shop Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
