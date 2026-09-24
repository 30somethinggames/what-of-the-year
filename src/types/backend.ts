import type { TOPIC_KEY } from "constants/topics";

import type { Option } from "./option";

/**
 * The backend seam's API, as the screens use it.
 *
 * Every call the client makes to a server is a hook in `src/db` or
 * `src/queries`, and each one implements a member of `Backend` below, so a
 * hook whose arguments or result drift from this file fails `mise run types`.
 * Nothing here names a vendor: this file is what a replacement backend has to
 * satisfy, and it stays when `convex/` and the hooks behind it are deleted.
 * Which paths those are is "The backend seam" in `docs/local-dev.md`.
 */

/** Ids are opaque strings the server mints; the client passes them back unread. */
export type SessionID = string;
export type PlayerID = string;
export type RoundID = string;
export type SelectionID = string;

/** `_creationTime` is epoch milliseconds, as is every other time in this file. */
interface Row {
  _creationTime: number;
}

/**
 * A game's lifecycle. `complete` is played through to the last round,
 * `forfeit` is ended early by the host; both show results, and only `forfeit`
 * sends the other players home.
 */
export type SessionStatus = "lobby" | "active" | "complete" | "forfeit";

export interface Session extends Row {
  _id: SessionID;
  topic: string;
  year: number;
  maxRounds: number;
  maxPlayers: number;
  playerCount: number;
  /** Rounds count down: the first played is `maxRounds`, the last is 1. */
  activeRoundNumber: number;
  status: SessionStatus;
}

export interface Player extends Row {
  _id: PlayerID;
  sessionId: SessionID;
  /** The identity the server authenticated, and the key every call is keyed by. */
  uid: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

/** `open` takes picks, `revealing` is showing them, `closed` is played out. */
export type RoundState = "pending" | "open" | "closed" | "revealing";

export interface Round extends Row {
  _id: RoundID;
  sessionId: SessionID;
  number: number;
  state: RoundState;
  /** Points a pick in this round is worth. */
  weight: number;
  selectionsComplete: number;
  startedAt: number | null;
  closedAt: number | null;
  /** When the reveal ends and the next round opens. Set only while `revealing`. */
  revealEndsAt?: number;
}

/** What a player picked. `id` is the option's id as a string, or a slug of `name` for a seeded pick. */
export interface PickOption {
  id: string;
  name: string;
  cover?: string;
  rating?: number;
  first_release_date?: number;
  summary?: string;
}

/** Another player's pick for a round. `pick` is null until the round reveals. */
export interface Selection {
  _id: SelectionID;
  uid: string;
  pick: PickOption | null;
}

/** One of the caller's own picks — always readable, reveal or not. */
export interface MySelection extends Row {
  _id: SelectionID;
  sessionId: SessionID;
  roundId: RoundID;
  uid: string;
  pick: PickOption;
  points: number;
  roundNumber: number;
  savedAt: number;
}

export interface Vote {
  playerName: string;
  playerAvatar: string;
  points: number;
}

/** A pick with every vote for it, ordered by `totalPoints` descending. */
export interface RankedPick {
  pick: PickOption;
  totalPoints: number;
  votes: Vote[];
}

/**
 * A live read. `isLoading` is true until the first result arrives and false
 * after, including while a later update is in flight. A read the caller is
 * not entitled to rejects instead: the error reaches the root error boundary,
 * never this result.
 */
interface Query {
  isLoading: boolean;
}

export interface SessionQuery extends Query {
  session: Session | null;
  /** `session.activeRoundNumber`, or undefined before the session arrives. */
  activeRound: number | undefined;
}

export interface PlayersQuery extends Query {
  players: Player[];
  /** Undefined while loading, null when the caller has not joined — which is what renders the join form. */
  currentUser: Player | null | undefined;
  isHost: boolean;
}

export interface RoundQuery extends Query {
  round: Round | null;
}

export interface SelectionsQuery extends Query {
  selections: Selection[];
}

export interface MySelectionsQuery extends Query {
  mySelections: MySelection[];
}

export interface ResultsQuery extends Query {
  results: RankedPick[];
}

/** The options to pick from for a topic and year, fetched once and cached. */
export interface OptionsQuery extends Query {
  data: Option[] | undefined;
  error: Error | null;
}

export interface TopicArgs {
  key: TOPIC_KEY;
  year: string;
}

/**
 * A write. It rejects when the caller is not entitled to it or the game is not
 * in the state it assumes; the screen catches that and shows the message.
 */
type Mutation<Args> = (args: Args) => Promise<unknown>;

export interface Backend {
  /**
   * The session itself, for any signed-in caller. It is the one read that does
   * not reject for a non-member: the session id is the invite, so a player
   * holding the link reads the session before they are in it.
   */
  useSession(sessionId: SessionID | undefined): SessionQuery;
  /** Creates a session with the caller as its host, and returns the id to navigate to. */
  useCreateSession(): (args: {
    topic: string;
    year: number;
    name: string;
    avatar: string;
  }) => Promise<{ sessionId: SessionID }>;
  /** Host-only. Opens the first round and puts the session in play. */
  useStartSession(): Mutation<{ sessionId: SessionID }>;
  /** Host-only. Ends the session where it stands. */
  useForfeitSession(): Mutation<{ sessionId: SessionID }>;

  /**
   * The roster, plus the caller's own player row. The roster is member-only,
   * so it waits on that row: a non-member gets `currentUser: null` and an
   * empty roster rather than the error boundary.
   */
  usePlayers(sessionId: SessionID | undefined): PlayersQuery;
  useJoinSession(): Mutation<{ sessionId: SessionID; name: string; avatar: string }>;
  /** Anyone but the host, in any state. */
  useLeaveSession(): Mutation<{ sessionId: SessionID }>;
  /** Host-only, and only before the session is in play. */
  useKickFromLobby(): Mutation<{ sessionId: SessionID; uid: string }>;
  /** Host-only, once the session is in play. */
  useKickFromGame(): Mutation<{ sessionId: SessionID; uid: string }>;

  /** Member-only, as every read below is. */
  useRound(sessionId: SessionID | undefined, roundNumber: number | undefined): RoundQuery;
  /** Host-only. Open to revealing, and revealing to closed with the next round opened. */
  useAdvanceRound(): Mutation<{ sessionId: SessionID; currentRoundNumber: number }>;

  /** Every player's selection for one round — who has picked, and what once it reveals. */
  useSelections(sessionId: SessionID | undefined, roundNumber: number | undefined): SelectionsQuery;
  /** The caller's own picks, every round, ascending by round number. */
  useMySelections(sessionId: SessionID | undefined): MySelectionsQuery;
  /**
   * The standings. Revealed rounds only, so the screens read it once the
   * session has ended — `complete`, or `forfeit` when the host ended it early.
   */
  useResults(sessionId: SessionID | undefined): ResultsQuery;
  /** Records a pick for a round that is open, where the caller has none. */
  useSaveSelection(): Mutation<{ sessionId: SessionID; roundNumber: number; option: Option }>;
  /** Replaces the caller's pick in a round that is still open. */
  useEditSelection(): Mutation<{ sessionId: SessionID; roundNumber: number; option: Option }>;

  /** The options for the topic in `key`; the other two hooks stay idle. */
  useTopicData(args: TopicArgs): OptionsQuery;
  useBooks(args: TopicArgs): OptionsQuery;
  useGames(args: TopicArgs): OptionsQuery;
  useMovies(args: TopicArgs): OptionsQuery;
}
