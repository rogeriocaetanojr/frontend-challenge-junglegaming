import { useEffect, useId, useState } from "react";
import { Clock } from "lucide-react";

import type { EthString } from "@/contracts/common";
import { cn } from "@/lib/utils";

export interface NftDetailHeaderProps {
  nft: {
    title: string;
    price?: EthString | string;
    endsAt?: string | number | Date | null;
  };
  className?: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isExpired: false };
}

function formatPad(num: number): string {
  return String(num).padStart(2, "0");
}

export function NftDetailHeader({ nft, className }: NftDetailHeaderProps) {
  const timerLabelId = useId();
  const endsAtDate = nft.endsAt ? new Date(nft.endsAt) : null;
  const hasValidEndsAt = Boolean(endsAtDate && !Number.isNaN(endsAtDate.getTime()));

  const endsAtTimestamp = hasValidEndsAt && endsAtDate ? endsAtDate.getTime() : null;

  const [timeLeft, setTimeLeft] = useState<TimeRemaining | null>(() => {
    if (!endsAtTimestamp) return null;
    return calculateTimeRemaining(new Date(endsAtTimestamp));
  });

  useEffect(() => {
    if (!endsAtTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(new Date(endsAtTimestamp));
      setTimeLeft(remaining);
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAtTimestamp]);

  return (
    <header className={cn("w-full space-y-2 font-mono select-none", className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Título Principal */}
        <h1 className="text-3xl sm:text-[34px] lg:text-[38px] font-bold text-[#F5F1EB] tracking-tight leading-none font-mono">
          {nft.title}
        </h1>

        {/* Timer regressivo discreto quando endsAt estiver presente */}
        {timeLeft && (
          <div
            className="flex items-center gap-2 bg-[#1E1410] border border-[#3F2319]/80 px-3 py-1.5 rounded-xl shrink-0"
            aria-live="polite"
            aria-atomic="true"
          >
            <Clock className="size-3.5 text-[#D28A4C]" aria-hidden="true" />
            <span
              id={timerLabelId}
              className="text-[11px] text-[#CFB28C] uppercase tracking-wider"
            >
              {timeLeft.isExpired ? "Encerrado" : "Termina em:"}
            </span>

            {timeLeft.isExpired ? (
              <span className="text-xs sm:text-sm font-bold text-red-400">
                Leilão Encerrado
              </span>
            ) : (
              <span
                className="text-xs sm:text-sm font-bold text-[#F5F1EB] tracking-wider"
                aria-labelledby={timerLabelId}
              >
                {formatPad(timeLeft.hours)}h {formatPad(timeLeft.minutes)}m{" "}
                {formatPad(timeLeft.seconds)}s
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default NftDetailHeader;
