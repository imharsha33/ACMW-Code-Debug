"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { KareAcmwBadge } from "./KareAcmwBadge";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete });

    // 1. Badge Logo fades & drops in at top center
    tl.to("#intro-badge-container", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
      // 2. "ACM-W STUDENT CHAPTER PRESENTS" subline fades in
      .to("#intro-presents-subline", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.2")
      // 3. Staggered drop-in of big HERIZON letters
      .to(".herizon-letter", {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.55,
        ease: "power3.out",
      }, "-=0.1")
      // 4. "Women Who Build" subline
      .to("#intro-women-subline", { opacity: 1, duration: 0.5 }, "-=0.2")
      .to({}, { duration: 1.2 })
      // 5. Dissolve whole intro screen into Landing Hero
      .to("#intro-stage", { opacity: 0, duration: 0.6, ease: "power2.inOut" });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={scope}>
      <div
        id="intro-stage"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4 overflow-hidden"
      >
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Top Badge Logo */}
          <div
            id="intro-badge-container"
            className="mb-3 opacity-0 translate-y-[-20px]"
          >
            <KareAcmwBadge size={80} />
          </div>

          {/* Subline: ACM-W STUDENT CHAPTER PRESENTS */}
          <div
            id="intro-presents-subline"
            className="opacity-0 translate-y-[-10px] mb-8 text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase text-blue-600"
          >
            ACM-W STUDENT CHAPTER PRESENTS
          </div>

          {/* Massive Staggered Big Letters: HER (Blue) + IZON (Pink) without hyphen */}
          <div className="flex items-center justify-center font-black tracking-tight text-6xl sm:text-8xl md:text-9xl mb-4 select-none">
            {["H", "E", "R"].map((char, idx) => (
              <span
                key={`blue-${idx}`}
                className="herizon-letter inline-block text-blue-600 opacity-0 translate-y-[-40px]"
                style={{ color: "#2563eb" }}
              >
                {char}
              </span>
            ))}
            {["I", "Z", "O", "N"].map((char, idx) => (
              <span
                key={`pink-${idx}`}
                className="herizon-letter inline-block text-pink-500 opacity-0 translate-y-[-40px]"
                style={{ color: "#ec4899" }}
              >
                {char}
              </span>
            ))}
          </div>

          {/* Bottom Subline: Women Who Build */}
          <div
            id="intro-women-subline"
            className="opacity-0 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-slate-400"
          >
            Women Who Build · 2026
          </div>
        </div>
      </div>
    </div>
  );
}
