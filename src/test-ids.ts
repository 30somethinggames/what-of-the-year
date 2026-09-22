/**
 * Every test id the app renders, grouped by the screen or shared component
 * that owns it. Components and Playwright specs both read them from here.
 */
export const testIds = {
  home: {
    start: "home-start",
  },
  topic: {
    randomAvatar: "random-avatar",
    nameInput: "name-input",
    submit: "setup-submit",
  },
  lobby: {
    sessionId: "session-id",
    invite: "invite",
    start: "lobby-start",
    leave: "leave-lobby",
  },
  round: {
    list: "round-list",
    pickInput: "pick-input",
    submitPick: "submit-pick",
    cancelEdit: "cancel-edit",
  },
  reveal: {
    container: "reveal-container",
    pick: "reveal-pick",
    playerName: "reveal-player-name",
    skip: "reveal-skip",
    countdown: "reveal-countdown",
  },
  results: {
    list: "results-list",
  },
  settings: {
    button: "settings-button",
    title: "settings-title",
    close: "close-settings",
  },
  // The settings screen and the sidebar are the same surface on two layouts,
  // so they carry the same two buttons.
  sidebar: {
    title: "sidebar-title",
    close: "close-sidebar",
    advanceRound: "advance-round",
    leaveGame: "leave-game",
  },
  error: {
    state: "error-state",
    retry: "error-retry",
    home: "error-home",
  },
  toast: {
    root: "toast",
  },
  picker: {
    topic: "topic-picker",
    year: "year-picker",
  },
  autocomplete: {
    suggestion: "suggestion-item",
  },
  lists: {
    editPick: "edit-pick",
    kickPlayer: "kick-player",
    playerCount: "player-count",
  },
} as const;
