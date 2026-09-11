import * as React from "react";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2600 }: SplashScreenProps) {
  const [visible, setVisible] = React.useState(true);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, duration - 600);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[1000] flex items-center justify-center bg-white
        transition-opacity duration-500 ease-out
        ${fading ? "opacity-0" : "opacity-100"}
      `}
      aria-label="Tela de carregamento Oxente"
    >
      <div className="flex items-center justify-center px-6">
        <img
          src="/logo-oficial.png"
          alt="Oxente Shopping"
          className="w-[340px] max-w-[84vw] animate-pulse-soft"
        />
      </div>
    </div>
  );
}
