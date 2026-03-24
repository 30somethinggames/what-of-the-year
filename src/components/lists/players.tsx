import type { Player } from "db/types";

import { Avatar } from "../avatar";
import { Row } from "./components/row";

interface Props {
  data: Player[];
  completedUids?: Set<string>;
  maxPlayerCount?: number;
  onKick?: (uid: string) => void;
}

export function PlayerList({ data, completedUids, maxPlayerCount, onKick }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-sm">
      {data.map((item) => {
        const hasCompleted = completedUids?.has(item.uid);
        return (
          <Row key={item.uid}>
            <Avatar source={item.avatar} size={40} />
            <span className="flex-1 font-medium text-lg">{item.name}</span>
            {item.isHost ? <span className="font-semibold text-sm text-grey-100">Host</span> : null}
            {completedUids ? (
              <span className="text-lg text-black-100">{hasCompleted ? "\u2713" : "..."}</span>
            ) : null}
            {onKick && !item.isHost ? (
              <button
                data-testid="kick-player"
                type="button"
                onClick={() => onKick(item.uid)}
                className="text-lg text-red-100"
              >
                \u2715
              </button>
            ) : null}
          </Row>
        );
      })}
      <div className="flex justify-end">
        <span data-testid="player-count" className="text-sm text-white-100">
          {`${data.length} of ${maxPlayerCount}`}
        </span>
      </div>
    </div>
  );
}
