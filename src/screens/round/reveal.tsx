import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "components/avatar";
import type { Player, Selection } from "db/types";
import { cn } from "utils/cn";

interface Props {
  selections: Selection[];
  players: Player[];
  revealEndsAt: number | undefined;
  isHost: boolean;
  onSkip: () => void;
}

const STEP_DURATION_MS = 3_000;

export function Reveal({ selections, players, revealEndsAt, isHost, onSkip }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const playerMap = new Map(players.map((p) => [p.uid, p]));

  const remainingSeconds = useMemo(() => {
    if (!revealEndsAt) return 0;
    return Math.max(0, (revealEndsAt - Date.now()) / 1000);
  }, [revealEndsAt]);

  useEffect(() => {
    if (activeIndex >= selections.length - 1) return;
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), STEP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, selections.length]);

  const current = selections[activeIndex];
  if (!current) return null;

  const player = playerMap.get(current.uid);

  return (
    <div data-testid="reveal-container" className="flex flex-1 flex-col px-md pb-md">
      <div className="flex flex-1 flex-col items-center justify-center gap-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id}
            className="flex w-full flex-col items-center gap-md"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
          >
            <div data-testid="reveal-pick" className="flex items-center gap-sm">
              {player ? <Avatar source={player.avatar} size={48} /> : null}
              <span
                data-testid="reveal-player-name"
                className="text-xl font-semibold text-black-100"
              >
                {player?.name ?? "Unknown"}
              </span>
            </div>

            <div className="flex w-full items-center gap-md rounded-lg border-2 border-topic bg-white-200 p-md">
              {current.pick.cover ? (
                <img
                  src={current.pick.cover}
                  alt={current.pick.name}
                  className="h-16 w-16 shrink-0 rounded-md bg-white-100 object-cover"
                />
              ) : null}
              <span className="text-lg font-semibold text-black-100">{current.pick.name}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-sm">
          {selections.map((sel, i) => (
            <div
              key={sel._id}
              className={cn(
                "h-2 w-2 rounded-full border border-grey-100 bg-white-100",
                i <= activeIndex ? "border-topic bg-topic" : "",
              )}
            />
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          type="button"
          data-testid="reveal-skip"
          className="relative mt-auto w-full overflow-hidden rounded-lg bg-topic-light py-md"
          onClick={onSkip}
        >
          <motion.div
            data-testid="reveal-countdown"
            className="absolute inset-0 bg-topic"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: remainingSeconds, ease: "linear" }}
          />
          <span className="relative text-xl font-semibold text-white-200 [text-shadow:0_0_1px_var(--color-black-100)]">
            Skip Reveal
          </span>
        </button>
      ) : null}
    </div>
  );
}
