import type { MySelection, RankedPick } from "db/types";

import { Row } from "./components/row";

type PickItem = MySelection | RankedPick;

function BaseDisplay({ rank, uri }: { rank: number; uri?: string }) {
  return (
    <>
      <span className="min-w-7 font-bold text-md text-black-100">#{rank}</span>
      {uri ? (
        <img
          src={uri}
          alt=""
          className="h-14 w-10 rounded-sm border border-black-100 object-cover"
        />
      ) : null}
    </>
  );
}

function RankedRow({ item, rank }: { item: RankedPick; rank: number }) {
  return (
    <Row>
      <BaseDisplay rank={rank} uri={item.pick.cover} />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-semibold text-md text-black-100">{item.pick.name}</span>
        <span className="text-sm text-grey-100">
          {item.votes.map((v) => v.playerName).join(", ")}
        </span>
      </div>
      <span className="font-bold text-md text-black-100">{item.totalPoints}pts</span>
    </Row>
  );
}

function SelectionRow({
  item,
  onEdit,
}: {
  item: MySelection;
  onEdit?: (item: MySelection) => void;
}) {
  return (
    <Row>
      <BaseDisplay rank={item.roundNumber} uri={item.pick.cover} />
      <span className="flex-1 text-md text-black-100">{item.pick.name}</span>
      {onEdit ? (
        <button
          data-testid="edit-pick"
          type="button"
          onClick={() => onEdit(item)}
          className="font-bold text-sm text-grey-100"
        >
          Edit
        </button>
      ) : null}
    </Row>
  );
}

interface Props {
  data: PickItem[];
  testID?: string;
  onEdit?: (item: MySelection) => void;
  /** Only this round's pick gets an Edit button — closed rounds are locked server-side. */
  editableRoundNumber?: number;
}

export function Picks({ data, testID, onEdit, editableRoundNumber }: Props) {
  return (
    <div data-testid={testID} className="flex flex-1 flex-col gap-sm">
      {data.map((item, index) =>
        "totalPoints" in item ? (
          <RankedRow key={item.pick.id} item={item} rank={index + 1} />
        ) : (
          <SelectionRow
            key={item.pick.id}
            item={item}
            onEdit={item.roundNumber === editableRoundNumber ? onEdit : undefined}
          />
        ),
      )}
    </div>
  );
}
