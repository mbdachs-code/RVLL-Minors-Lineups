const INNINGS = 6;
const FIELD_POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
const POSITION_OPTIONS = ["DH", ...FIELD_POSITIONS];
const STORAGE_KEY = "division-lineup-generator-saved-lineups";
const ROSTER_STORAGE_KEY = "division-lineup-generator-team-roster";
const DEMO_PLAYERS = [
  "Cooper",
  "Owen",
  "Mason",
  "Jack",
  "Lucas",
  "Ethan",
  "Aiden",
  "Noah",
  "Henry",
  "Wyatt",
  "Levi",
  "Caleb"
];

const TEAMS = [
  {
    name: "Yankees",
    shortName: "Yankees",
    espnCode: "nyy",
    primary: "#0C2340",
    secondary: "#C4CED4",
    accent: "#FFFFFF",
    ink: "#18212C",
    soft: "#F3EFE6"
  },
  {
    name: "Pirates",
    shortName: "Pirates",
    espnCode: "pit",
    primary: "#27251F",
    secondary: "#FDB827",
    accent: "#FFFFFF",
    ink: "#1F1A17",
    soft: "#FAF1DB"
  },
  {
    name: "Padres",
    shortName: "Padres",
    espnCode: "sd",
    primary: "#2F241D",
    secondary: "#FFC425",
    accent: "#FFFFFF",
    ink: "#221B16",
    soft: "#F7F0E4"
  },
  {
    name: "Marlins",
    shortName: "Marlins",
    espnCode: "mia",
    primary: "#00A3E0",
    secondary: "#EF3340",
    accent: "#171717",
    ink: "#14212B",
    soft: "#EBF9FF"
  },
  {
    name: "Cubs",
    shortName: "Cubs",
    espnCode: "chc",
    primary: "#0E3386",
    secondary: "#CC3433",
    accent: "#FFFFFF",
    ink: "#14223A",
    soft: "#EEF3FF"
  },
  {
    name: "Brewers",
    shortName: "Brewers",
    espnCode: "mil",
    primary: "#12284B",
    secondary: "#FFC52F",
    accent: "#FFFFFF",
    ink: "#172338",
    soft: "#FBF3DD"
  },
  {
    name: "Braves",
    shortName: "Braves",
    espnCode: "atl",
    primary: "#13274F",
    secondary: "#CE1141",
    accent: "#FFFFFF",
    ink: "#182437",
    soft: "#FAEEF2"
  },
  {
    name: "Blue Jays",
    shortName: "Blue Jays",
    espnCode: "tor",
    primary: "#134A8E",
    secondary: "#E8291C",
    accent: "#FFFFFF",
    ink: "#1D2D5C",
    soft: "#EEF4FB"
  }
].map((team) => ({
  ...team,
  logoUrl: `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${team.espnCode}.png`
}));

const state = {
  afterSpringBreak: false,
  game: {
    team: "Yankees",
    opponent: "Pirates",
    ownTeamIsHome: true,
    location: "",
    date: "",
    time: ""
  },
  players: [],
  savedLineups: [],
  savedRoster: null,
  removedPlayers: []
};

const springBreakToggle = document.querySelector("#springBreakToggle");
const homeTeamToggle = document.querySelector("#homeTeamToggle");
const teamInput = document.querySelector("#teamInput");
const opponentInput = document.querySelector("#opponentInput");
const locationInput = document.querySelector("#locationInput");
const dateInput = document.querySelector("#dateInput");
const timeInput = document.querySelector("#timeInput");
const opponentPreview = document.querySelector("#opponentPreview");
const heroBrand = document.querySelector("#heroBrand");
const addPlayerButton = document.querySelector("#addPlayerButton");
const randomizeOrderButton = document.querySelector("#randomizeOrderButton");
const saveRosterButton = document.querySelector("#saveRosterButton");
const restoreRosterButton = document.querySelector("#restoreRosterButton");
const saveLineupButton = document.querySelector("#saveLineupButton");
const resetButton = document.querySelector("#resetButton");
const savedLineups = document.querySelector("#savedLineups");
const savedRosterSummary = document.querySelector("#savedRosterSummary");
const rosterEditor = document.querySelector("#rosterEditor");
const battingOrder = document.querySelector("#battingOrder");
const positionsGrid = document.querySelector("#positionsGrid");
const validationSummary = document.querySelector("#validationSummary");
const printButton = document.querySelector("#printButton");
const printSheets = document.querySelector("#printSheets");
let draggedPlayerId = null;

function createPlayer(name, index) {
  return {
    id: crypto.randomUUID(),
    name,
    battingOrder: index + 1,
    positions: Array.from({ length: INNINGS }, () => "DH"),
    possibleReliever: false
  };
}

function getTeam(name) {
  return TEAMS.find((team) => team.name === name) || TEAMS[0];
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

function applyTeamTheme() {
  const team = getTeam(state.game.team);
  const root = document.documentElement;
  root.style.setProperty("--navy", team.primary);
  root.style.setProperty("--navy-deep", team.ink);
  root.style.setProperty("--gold", team.secondary);
  root.style.setProperty("--gold-soft", team.accent);
  root.style.setProperty("--cream", team.soft);
  root.style.setProperty("--ink", team.ink);
  root.style.setProperty("--theme-primary-rgb", hexToRgb(team.primary));
  root.style.setProperty("--theme-secondary-rgb", hexToRgb(team.secondary));
  document.title = getDefaultExportFileName();
}

function getCompactGameDate() {
  if (!state.game.date) {
    return "000000";
  }

  const match = state.game.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "000000";
  }

  const [, year, month, day] = match;
  return `${year.slice(-2)}${month}${day}`;
}

function getDefaultExportFileName() {
  const myTeam = state.game.team || "My Team";
  const opponent = state.game.opponent || "TBD";
  return `${getCompactGameDate()} ${myTeam} vs. ${opponent}`;
}

function seedDefaultPositions() {
  const defaults = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "DH", "DH"];
  state.players.forEach((player, playerIndex) => {
    for (let inningIndex = 0; inningIndex < INNINGS; inningIndex += 1) {
      player.positions[inningIndex] = defaults[(playerIndex + inningIndex) % defaults.length];
    }
    player.possibleReliever = playerIndex < 4;
  });
}

function applySavedRoster(savedRoster) {
  if (!savedRoster?.players?.length) {
    return false;
  }

  state.players = savedRoster.players.map((entry, index) => {
    const player = createPlayer(entry.name || `Player ${index + 1}`, index);
    player.battingOrder = entry.battingOrder || index + 1;
    player.possibleReliever = Boolean(entry.possibleReliever);
    return player;
  });
  seedDefaultPositions();
  state.players.forEach((player, index) => {
    const savedPlayer = savedRoster.players[index];
    if (savedPlayer) {
      player.possibleReliever = Boolean(savedPlayer.possibleReliever);
      player.battingOrder = savedPlayer.battingOrder || index + 1;
    }
  });
  normalizeBattingOrder();
  state.removedPlayers = [];
  return true;
}

function resetDemoRoster() {
  state.afterSpringBreak = false;
  if (!applySavedRoster(state.savedRoster)) {
    state.players = DEMO_PLAYERS.map((name, index) => createPlayer(name, index));
    seedDefaultPositions();
    state.removedPlayers = [];
  }
  render();
}

function sortPlayersByOrder() {
  state.players.sort((a, b) => a.battingOrder - b.battingOrder);
}

function normalizeBattingOrder() {
  sortPlayersByOrder();
  state.players.forEach((player, index) => {
    player.battingOrder = index + 1;
  });
}

function loadSavedLineups() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state.savedLineups = raw ? JSON.parse(raw) : [];
  } catch (error) {
    state.savedLineups = [];
  }
}

function loadSavedRoster() {
  try {
    const raw = window.localStorage.getItem(ROSTER_STORAGE_KEY);
    state.savedRoster = raw ? JSON.parse(raw) : null;
  } catch (error) {
    state.savedRoster = null;
  }
}

function persistSavedLineups() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedLineups));
}

function persistSavedRoster() {
  if (!state.savedRoster) {
    window.localStorage.removeItem(ROSTER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(state.savedRoster));
}

function getGameDisplayDate() {
  if (!state.game.date) {
    return "Date TBD";
  }
  const parsed = new Date(`${state.game.date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return state.game.date;
  }
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function getGameDisplayTime() {
  if (!state.game.time) {
    return "Time TBD";
  }
  const [hours = "0", minutes = "0"] = state.game.time.split(":");
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getHomeTeamName() {
  return state.game.ownTeamIsHome ? state.game.team : (state.game.opponent || "TBD");
}

function getVisitorTeamName() {
  return state.game.ownTeamIsHome ? (state.game.opponent || "TBD") : state.game.team;
}

function getHomeLogoTeamName() {
  return state.game.ownTeamIsHome ? state.game.team : state.game.opponent;
}

function getVisitorLogoTeamName() {
  return state.game.ownTeamIsHome ? state.game.opponent : state.game.team;
}

function getMatchupText() {
  return `${getVisitorTeamName()} @ ${getHomeTeamName()}`;
}

function createLineupSnapshot() {
  return {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    label: [
      getMatchupText(),
      getGameDisplayDate(),
      getGameDisplayTime()
    ].join(" • "),
    afterSpringBreak: state.afterSpringBreak,
    game: { ...state.game },
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      battingOrder: player.battingOrder,
      positions: [...player.positions],
      possibleReliever: Boolean(player.possibleReliever)
    }))
  };
}

function loadSnapshot(snapshot) {
  state.afterSpringBreak = Boolean(snapshot.afterSpringBreak);
  state.game = {
    team: snapshot.game?.team || "Yankees",
    opponent: snapshot.game?.opponent || "",
    ownTeamIsHome: snapshot.game?.ownTeamIsHome !== false,
    location: snapshot.game?.location || "",
    date: snapshot.game?.date || "",
    time: snapshot.game?.time || ""
  };
  state.players = (snapshot.players || []).map((player, index) => ({
    id: player.id || crypto.randomUUID(),
    name: player.name || `Player ${index + 1}`,
    battingOrder: player.battingOrder || index + 1,
    positions: Array.from({ length: INNINGS }, (_, inningIndex) => {
      const value = player.positions?.[inningIndex] || "DH";
      return POSITION_OPTIONS.includes(value) ? value : "DH";
    }),
    possibleReliever: Boolean(player.possibleReliever)
  }));
  state.removedPlayers = [];
  render();
}

function addPlayer() {
  state.players.push(createPlayer(`Player ${state.players.length + 1}`, state.players.length));
  normalizeBattingOrder();
  render();
}

function removePlayer(playerId) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    return;
  }

  state.removedPlayers.push({
    name: player.name || "Unnamed Player",
    possibleReliever: Boolean(player.possibleReliever)
  });
  state.players = state.players.filter((entry) => entry.id !== playerId);
  normalizeBattingOrder();
  render();
}

function addRemovedPlayer(index) {
  const removedPlayer = state.removedPlayers[index];
  if (!removedPlayer) {
    return;
  }

  const player = createPlayer(removedPlayer.name || `Player ${state.players.length + 1}`, state.players.length);
  player.possibleReliever = Boolean(removedPlayer.possibleReliever);
  state.players.push(player);
  state.removedPlayers.splice(index, 1);
  normalizeBattingOrder();
  render();
}

function randomizeBattingOrder() {
  const shuffled = [...state.players];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  shuffled.forEach((player, index) => {
    player.battingOrder = index + 1;
  });
  state.players = shuffled;
  render();
}

function saveCurrentLineup() {
  state.savedLineups = [createLineupSnapshot(), ...state.savedLineups].slice(0, 20);
  persistSavedLineups();
  renderSavedLineups();
}

function saveCurrentRoster() {
  state.savedRoster = {
    savedAt: new Date().toISOString(),
    team: state.game.team,
    ownTeamIsHome: state.game.ownTeamIsHome,
    players: getPlayersByBattingOrder().map((player, index) => ({
      name: player.name,
      battingOrder: index + 1,
      possibleReliever: Boolean(player.possibleReliever)
    }))
  };
  state.removedPlayers = [];
  persistSavedRoster();
  render();
}

function restoreSavedRoster() {
  if (!applySavedRoster(state.savedRoster)) {
    return;
  }
  render();
}

function deleteSavedLineup(snapshotId) {
  state.savedLineups = state.savedLineups.filter((snapshot) => snapshot.id !== snapshotId);
  persistSavedLineups();
  renderSavedLineups();
}

function handleRosterNameChange(playerId, value) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    return;
  }
  player.name = value.trimStart();
}

function handleBattingOrderChange(playerId, value) {
  const nextOrder = Number.parseInt(value, 10);
  if (Number.isNaN(nextOrder)) {
    return;
  }

  const orderedPlayers = getPlayersByBattingOrder();
  const currentIndex = orderedPlayers.findIndex((entry) => entry.id === playerId);
  if (currentIndex === -1) {
    return;
  }

  const targetIndex = Math.max(0, Math.min(orderedPlayers.length - 1, nextOrder - 1));
  const [player] = orderedPlayers.splice(currentIndex, 1);
  orderedPlayers.splice(targetIndex, 0, player);
  orderedPlayers.forEach((entry, index) => {
    entry.battingOrder = index + 1;
  });
  state.players = orderedPlayers;
  render();
}

function movePlayerToBattingIndex(playerId, targetIndex) {
  const orderedPlayers = getPlayersByBattingOrder();
  const currentIndex = orderedPlayers.findIndex((entry) => entry.id === playerId);
  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= orderedPlayers.length) {
    return;
  }

  const [player] = orderedPlayers.splice(currentIndex, 1);
  orderedPlayers.splice(targetIndex, 0, player);
  orderedPlayers.forEach((entry, index) => {
    entry.battingOrder = index + 1;
  });
  state.players = orderedPlayers;
  render();
}

function handlePositionChange(playerId, inningIndex, value) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    return;
  }
  player.positions[inningIndex] = value;
  render();
}

function handleRelieverToggle(playerId, checked) {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    return;
  }
  player.possibleReliever = checked;
  render();
}

function handleGameDetailChange(field, value) {
  state.game[field] = value;
  if (field === "team" && value === state.game.opponent) {
    state.game.opponent = "";
  }
  render();
}

function getOpponentChoices() {
  return TEAMS.filter((team) => team.name !== state.game.team);
}

function renderTeamSelectors() {
  teamInput.innerHTML = "";
  TEAMS.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.name;
    option.textContent = team.name;
    option.selected = state.game.team === team.name;
    teamInput.appendChild(option);
  });

  opponentInput.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select opponent";
  placeholder.selected = !state.game.opponent;
  opponentInput.appendChild(placeholder);

  getOpponentChoices().forEach((team) => {
    const option = document.createElement("option");
    option.value = team.name;
    option.textContent = team.name;
    option.selected = state.game.opponent === team.name;
    opponentInput.appendChild(option);
  });
}

function getPlayersByBattingOrder() {
  return [...state.players].sort((a, b) => a.battingOrder - b.battingOrder);
}

function getPlayersAlphabetically() {
  const getFirstName = (name) => (name || "").trim().split(/\s+/)[0] || "";
  return [...state.players].sort((a, b) => getFirstName(a.name).localeCompare(getFirstName(b.name)) || (a.name || "").localeCompare(b.name || ""));
}

function getPitcherInnings(player) {
  return player.positions.reduce((innings, position, inningIndex) => {
    if (position === "P") {
      innings.push(inningIndex);
    }
    return innings;
  }, []);
}

function getCatchingInnings(player) {
  return player.positions.reduce((innings, position, inningIndex) => {
    if (position === "C") {
      innings.push(inningIndex);
    }
    return innings;
  }, []);
}

function getPitchingSegments(player) {
  const innings = getPitcherInnings(player);
  if (!innings.length) {
    return [];
  }
  const segments = [{ start: innings[0], end: innings[0] }];
  for (let index = 1; index < innings.length; index += 1) {
    const inningIndex = innings[index];
    const last = segments[segments.length - 1];
    if (inningIndex === last.end + 1) {
      last.end = inningIndex;
    } else {
      segments.push({ start: inningIndex, end: inningIndex });
    }
  }
  return segments;
}

function getPitchingPlan() {
  const pitchers = state.players
    .map((player) => ({ player, innings: getPitcherInnings(player) }))
    .filter((entry) => entry.innings.length > 0)
    .sort((a, b) => a.innings[0] - b.innings[0] || a.player.battingOrder - b.player.battingOrder);

  return {
    starter: pitchers[0]?.player || null,
    relievers: pitchers.slice(1).map((entry) => entry.player),
    possibleRelievers: state.players.filter((player) => player.possibleReliever)
  };
}

function getPrintablePosition(player, inningIndex) {
  const position = player.positions[inningIndex];
  if (position !== "P") {
    return position;
  }
  return "P";
}

function getPositionTone(position) {
  if (position === "DH") {
    return "dh";
  }
  if (["1B", "2B", "3B", "SS"].includes(position)) {
    return "infield";
  }
  if (["LF", "CF", "RF"].includes(position)) {
    return "outfield";
  }
  return "standard";
}

function needsWarmupBall(position) {
  return position === "1B" || position === "RF";
}

function getGameMetaLine() {
  return [
    `Visitor: ${getVisitorTeamName()}`,
    `Home: ${getHomeTeamName()}`,
    state.game.location ? `Location: ${state.game.location}` : "Location: TBD",
    getGameDisplayDate(),
    getGameDisplayTime()
  ].join(" | ");
}

function createLogoBadge(teamName, size = "default") {
  const team = getTeam(teamName);
  const wrapper = document.createElement("div");
  wrapper.className = `logo-badge${size === "large" ? " large" : ""}`;
  const image = document.createElement("img");
  image.alt = `${team.name} logo`;
  image.src = team.logoUrl;
  wrapper.appendChild(image);
  return wrapper;
}

function createAtMarker() {
  const marker = document.createElement("span");
  marker.className = "at-marker";
  marker.textContent = "@";
  return marker;
}

function renderBranding() {
  applyTeamTheme();
  const team = getTeam(state.game.team);

  heroBrand.innerHTML = "";
  const logoRow = document.createElement("div");
  logoRow.className = "logo-inline";
  logoRow.appendChild(createLogoBadge(team.name, "large"));

  const copy = document.createElement("div");
  copy.innerHTML = `<h1>${team.shortName}</h1><p class="sheet-subtitle">Division lineup builder</p>`;
  logoRow.appendChild(copy);
  heroBrand.appendChild(logoRow);

  opponentPreview.innerHTML = "";
  if (!state.game.opponent) {
    opponentPreview.innerHTML = "<div class='empty-state'>Choose an opponent to show both team logos on the app and printouts.</div>";
    return;
  }

  const preview = document.createElement("div");
  preview.className = "logo-inline";
  if (getVisitorLogoTeamName()) {
    preview.appendChild(createLogoBadge(getVisitorLogoTeamName()));
  }
  preview.appendChild(createAtMarker());
  if (getHomeLogoTeamName()) {
    preview.appendChild(createLogoBadge(getHomeLogoTeamName()));
  }

  const text = document.createElement("div");
  text.innerHTML = `<strong>${getMatchupText()}</strong><div class="sheet-subtitle">${state.game.location || "Field TBD"} • ${getGameDisplayDate()} • ${getGameDisplayTime()}</div>`;
  preview.appendChild(text);
  opponentPreview.appendChild(preview);
}

function renderRosterEditor() {
  rosterEditor.innerHTML = "";
  state.players.forEach((player) => {
    const card = document.createElement("div");
    card.className = "roster-card";

    const nameField = document.createElement("label");
    nameField.className = "player-name-field";
    nameField.innerHTML = "<span>Player</span>";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.maxLength = 24;
    nameInput.value = player.name;
    nameInput.addEventListener("input", (event) => handleRosterNameChange(player.id, event.target.value));
    nameInput.addEventListener("change", () => render());
    nameInput.addEventListener("blur", () => render());
    nameField.appendChild(nameInput);

    const orderField = document.createElement("label");
    orderField.className = "order-field";
    orderField.innerHTML = "<span>Batting Slot</span>";
    const orderInput = document.createElement("input");
    orderInput.type = "number";
    orderInput.min = "1";
    orderInput.max = String(state.players.length);
    orderInput.value = String(player.battingOrder);
    orderInput.addEventListener("change", (event) => handleBattingOrderChange(player.id, event.target.value));
    orderField.appendChild(orderInput);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost small-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => removePlayer(player.id));

    card.append(nameField, orderField, removeButton);
    rosterEditor.appendChild(card);
  });

  if (!state.removedPlayers.length) {
    return;
  }

  const removedHeader = document.createElement("div");
  removedHeader.className = "empty-state";
  removedHeader.innerHTML = "<strong>Removed From This Game</strong><br><small>Use Add to bring a player back into the lineup.</small>";
  rosterEditor.appendChild(removedHeader);

  state.removedPlayers.forEach((player, index) => {
    const card = document.createElement("div");
    card.className = "roster-card";

    const nameField = document.createElement("div");
    nameField.className = "player-name-field";
    nameField.innerHTML = `<span>Player</span><strong>${player.name || "Unnamed Player"}</strong>`;

    const statusField = document.createElement("div");
    statusField.className = "player-name-field";
    statusField.innerHTML = "<span>Batting Slot</span><strong>Out for this game</strong>";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "ghost small-button";
    addButton.textContent = "Add";
    addButton.addEventListener("click", () => addRemovedPlayer(index));

    card.append(nameField, statusField, addButton);
    rosterEditor.appendChild(card);
  });
}

function renderSavedLineups() {
  savedLineups.innerHTML = "";
  if (!state.savedLineups.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No saved lineups yet. Save the current lineup to keep it for later.";
    savedLineups.appendChild(empty);
    return;
  }

  state.savedLineups.forEach((snapshot) => {
    const card = document.createElement("div");
    card.className = "saved-lineup-card";

    const text = document.createElement("div");
    text.className = "player-name-field";
    text.innerHTML = `<span>Saved lineup</span><strong>${snapshot.label}</strong><small>${new Date(snapshot.savedAt).toLocaleString()}</small>`;

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "small-button";
    loadButton.textContent = "Load";
    loadButton.addEventListener("click", () => loadSnapshot(snapshot));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ghost small-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteSavedLineup(snapshot.id));

    card.append(text, loadButton, deleteButton);
    savedLineups.appendChild(card);
  });
}

function renderSavedRosterSummary() {
  if (!state.savedRoster?.players?.length) {
    savedRosterSummary.textContent = "No team roster saved yet. Save your full roster once, then restore it for future games.";
    return;
  }

  const savedAt = new Date(state.savedRoster.savedAt).toLocaleString();
  const names = state.savedRoster.players.map((player) => player.name || "Unnamed Player").join(", ");
  savedRosterSummary.innerHTML = `<strong>Saved team roster:</strong> ${state.savedRoster.players.length} players for ${state.savedRoster.team || state.game.team}.<br><small>Saved ${savedAt}</small><br><small>${names}</small>`;
}

function renderBattingOrder() {
  battingOrder.innerHTML = "";
  const { starter, relievers, possibleRelievers } = getPitchingPlan();

  getPlayersByBattingOrder().forEach((player) => {
    const row = document.createElement("div");
    row.className = "order-row";
    row.draggable = true;
    row.addEventListener("dragstart", () => {
      draggedPlayerId = player.id;
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      draggedPlayerId = null;
      row.classList.remove("dragging");
    });
    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      row.classList.add("drag-target");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("drag-target");
    });
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("drag-target");
      if (!draggedPlayerId || draggedPlayerId === player.id) {
        return;
      }
      const orderedPlayers = getPlayersByBattingOrder();
      const targetIndex = orderedPlayers.findIndex((entry) => entry.id === player.id);
      movePlayerToBattingIndex(draggedPlayerId, targetIndex);
    });

    const playerName = document.createElement("div");
    playerName.className = "player-name-field";
    playerName.innerHTML = `<span>Slot ${player.battingOrder}</span><strong>${player.name || "Unnamed Player"}</strong>`;

    const summary = document.createElement("div");
    summary.className = "player-name-field";
    const catcherInnings = player.positions.filter((position) => position === "C").length;
    const pitcherInnings = player.positions.filter((position) => position === "P").length;
    summary.innerHTML = `<span>Workload</span><strong>${catcherInnings} catching inning(s), ${pitcherInnings} pitching inning(s)</strong>`;

    const rolePill = document.createElement("span");
    let roleText = "Field Player";
    let tone = "warn";
    if (starter && starter.id === player.id) {
      roleText = "Starting Pitcher";
      tone = "ok";
    } else if (relievers.some((entry) => entry.id === player.id)) {
      roleText = "Reliever";
      tone = "ok";
    } else if (possibleRelievers.some((entry) => entry.id === player.id)) {
      roleText = "Possible Reliever";
      tone = "warn";
    }
    rolePill.className = `pill ${tone}`;
    rolePill.textContent = roleText;

    row.append(playerName, summary, rolePill);
    battingOrder.appendChild(row);
  });
}

function renderPositionsGrid() {
  positionsGrid.innerHTML = "";
  const table = document.createElement("table");
  table.className = "positions-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Player", "Inning 1", "Inning 2", "Inning 3", "Inning 4", "Inning 5", "Inning 6"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  state.players.forEach((player) => {
    const row = document.createElement("tr");
    const playerCell = document.createElement("td");
    playerCell.className = "player-cell player-meta-cell";

    const metaWrap = document.createElement("div");
    metaWrap.className = "player-meta";
    const name = document.createElement("div");
    name.textContent = player.name || "Unnamed Player";

    const relieverLabel = document.createElement("label");
    relieverLabel.className = "reliever-toggle";
    const relieverCheckbox = document.createElement("input");
    relieverCheckbox.type = "checkbox";
    relieverCheckbox.checked = player.possibleReliever;
    relieverCheckbox.addEventListener("change", (event) => handleRelieverToggle(player.id, event.target.checked));
    const relieverText = document.createElement("span");
    relieverText.textContent = "Possible Reliever";
    relieverLabel.append(relieverCheckbox, relieverText);

    metaWrap.append(name, relieverLabel);
    playerCell.appendChild(metaWrap);
    row.appendChild(playerCell);

    for (let inningIndex = 0; inningIndex < INNINGS; inningIndex += 1) {
      const cell = document.createElement("td");
      const select = document.createElement("select");
      select.className = `position-select position-${getPositionTone(player.positions[inningIndex])}`;
      POSITION_OPTIONS.forEach((position) => {
        const option = document.createElement("option");
        option.value = position;
        option.textContent = position;
        option.selected = player.positions[inningIndex] === position;
        select.appendChild(option);
      });
      select.addEventListener("change", (event) => handlePositionChange(player.id, inningIndex, event.target.value));
      cell.appendChild(select);

      if (needsWarmupBall(player.positions[inningIndex])) {
        const icon = document.createElement("span");
        icon.className = "warmup-icon";
        icon.title = "Grab a ball for warmups";
        icon.setAttribute("aria-label", "Grab a ball for warmups");
        cell.appendChild(icon);
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  positionsGrid.appendChild(table);
}

function validateLineup() {
  const issues = [];
  const cautions = [];
  const notes = [];
  const pitcherLimit = state.afterSpringBreak ? 9 : 6;

  for (let inningIndex = 0; inningIndex < INNINGS; inningIndex += 1) {
    const counts = POSITION_OPTIONS.reduce((map, position) => {
      map[position] = 0;
      return map;
    }, {});

    state.players.forEach((player) => {
      counts[player.positions[inningIndex]] += 1;
    });

    FIELD_POSITIONS.forEach((position) => {
      if (counts[position] === 0) {
        issues.push(`Inning ${inningIndex + 1} is missing ${position}.`);
      } else if (counts[position] > 1) {
        issues.push(`Inning ${inningIndex + 1} has more than one player at ${position}.`);
      }
    });

    const expectedDh = Math.max(0, state.players.length - FIELD_POSITIONS.length);
    if (counts.DH !== expectedDh) {
      cautions.push(`Inning ${inningIndex + 1} has ${counts.DH} DH assignment(s). With ${state.players.length} players, it should usually be ${expectedDh}.`);
    }
  }

  const pitchingNotes = [];

  state.players.forEach((player) => {
    const catchingInnings = getCatchingInnings(player);
    const pitcherInnings = getPitcherInnings(player);
    const pitchingOuts = pitcherInnings.length * 3;
    const fieldOuts = player.positions.filter((position) => position !== "DH").length * 3;

    if (catchingInnings.length > 3) {
      issues.push(`${player.name || "Unnamed Player"} is catching ${catchingInnings.length} innings. Limit is 3.`);
    }

    if (fieldOuts < 12) {
      issues.push(`${player.name || "Unnamed Player"} is scheduled for ${fieldOuts} defensive outs. Minimum is 12.`);
    }

    for (let inningIndex = 0; inningIndex < INNINGS - 1; inningIndex += 1) {
      if (player.positions[inningIndex] === "DH" && player.positions[inningIndex + 1] === "DH") {
        issues.push(`${player.name || "Unnamed Player"} sits out consecutive innings ${inningIndex + 1} and ${inningIndex + 2}.`);
        break;
      }
    }

    if (pitchingOuts > pitcherLimit) {
      issues.push(`${player.name || "Unnamed Player"} is scheduled for ${pitchingOuts} pitching outs. Limit is ${pitcherLimit}.`);
    }

    if (catchingInnings.length > 3) {
      const fourthCatchInning = catchingInnings[3];
      const pitchesAfterFourthCatch = pitcherInnings.some((inningIndex) => inningIndex >= fourthCatchInning);
      if (pitchesAfterFourthCatch) {
        issues.push(`${player.name || "Unnamed Player"} pitches after catching more than 3 innings.`);
      }
    }

    if (getPitchingSegments(player).length > 1) {
      issues.push(`${player.name || "Unnamed Player"} returns to pitcher after leaving the mound. Keep pitching in one continuous stint.`);
    }

    if (player.possibleReliever && !pitcherInnings.length) {
      cautions.push(`${player.name || "Unnamed Player"} is marked as a possible reliever but is not currently assigned to pitch.`);
    }

    if (pitcherInnings.length) {
      pitchingNotes.push({
        firstInning: pitcherInnings[0],
        text: `${player.name || "Unnamed Player"}: pitches innings ${pitcherInnings.map((inning) => inning + 1).join(", ")}.`
      });
    }
  });

  const pitchingPlan = getPitchingPlan();
  if (!pitchingPlan.starter) {
    issues.push("No starting pitcher assigned. One player must be set to P in the earliest pitching inning.");
  } else {
    notes.unshift(`Starting pitcher: ${pitchingPlan.starter.name || "Unnamed Player"}.`);
  }

  if (pitchingPlan.relievers.length) {
    notes.push(`Relievers: ${pitchingPlan.relievers.map((player) => player.name || "Unnamed Player").join(", ")}.`);
  }

  pitchingNotes
    .sort((a, b) => a.firstInning - b.firstInning || a.text.localeCompare(b.text))
    .forEach((entry) => notes.push(entry.text));

  return { issues, cautions, notes, pitcherLimit };
}

function renderValidationSummary() {
  validationSummary.innerHTML = "";
  const { issues, cautions, notes, pitcherLimit } = validateLineup();

  [
    {
      title: "Rule Status",
      tone: issues.length ? "bad" : cautions.length ? "warn" : "ok",
      description: issues.length
        ? "The lineup needs changes before it is game-ready."
        : cautions.length
          ? "The lineup is close, but a few items need a second look."
          : "All requested lineup rules currently pass.",
      items: issues.length ? issues : cautions.length ? cautions : [`Pitching limit is set to ${pitcherLimit} outs per player.`]
    },
    {
      title: "Pitching Notes",
      tone: notes.length ? "ok" : "warn",
      description: notes.length ? "Current starter and reliever summary." : "No pitchers assigned yet.",
      items: notes.length ? notes : ["Assign at least one pitcher in the inning grid."]
    }
  ].forEach((cardData) => {
    const card = document.createElement("article");
    card.className = `summary-card ${cardData.tone}`;

    const heading = document.createElement("h3");
    heading.textContent = cardData.title;
    const description = document.createElement("p");
    description.textContent = cardData.description;
    const list = document.createElement("ul");
    cardData.items.forEach((item) => {
      const li = document.createElement("li");
      if (cardData.title === "Rule Status" && (/is missing|more than one player at/.test(item))) {
        const strong = document.createElement("strong");
        strong.textContent = item;
        li.appendChild(strong);
      } else {
        li.textContent = item;
      }
      list.appendChild(li);
    });

    card.append(heading, description, list);
    validationSummary.appendChild(card);
  });
}

function createSheetCard(title, subtitle, contentBuilder) {
  const card = document.createElement("article");
  card.className = "sheet-card";
  if (title.startsWith("Coach Sheet")) {
    card.classList.add("coach-sheet");
  } else if (title === "Dugout Batting Order") {
    card.classList.add("dugout-sheet");
  } else if (title === "Positions By Batting Order") {
    card.classList.add("positions-sheet");
  }

  const header = document.createElement("div");
  header.className = "sheet-header";

  const left = document.createElement("div");
  left.className = "sheet-brands";
  if (getVisitorLogoTeamName()) {
    left.appendChild(createLogoBadge(getVisitorLogoTeamName()));
  }
  left.appendChild(createAtMarker());
  if (getHomeLogoTeamName()) {
    left.appendChild(createLogoBadge(getHomeLogoTeamName()));
  }

  const copy = document.createElement("div");
  copy.className = "sheet-brand-copy";
  copy.innerHTML = `<h3>${title}</h3>`;
  left.appendChild(copy);

  const right = document.createElement("p");
  right.className = "meta-line";
  right.textContent = getGameMetaLine();

  header.append(left, right);

  const content = document.createElement("div");
  content.className = "sheet-content";
  contentBuilder(content);

  if (state.game.team === "Yankees") {
    const saying = document.createElement("div");
    saying.className = "team-saying";
    saying.textContent = "Yankees say 'Oh Hell Ya'";
    content.appendChild(saying);
  }

  card.append(header, content);
  return card;
}

function buildPitchingSummary(container) {
  const plan = getPitchingPlan();
  const wrap = document.createElement("div");
  wrap.className = "pitching-summary-row";

  const pool = plan.possibleRelievers
    .filter((player) => !plan.relievers.some((reliever) => reliever.id === player.id) && (!plan.starter || plan.starter.id !== player.id))
    .map((player) => player.name || "Unnamed Player");

  [
    { label: "SP", value: plan.starter ? plan.starter.name : "Not assigned" },
    { label: "RP", value: plan.relievers.length ? plan.relievers.map((player) => player.name || "Unnamed Player").join(", ") : "None assigned" },
    { label: "Pool", value: pool.length ? pool.join(", ") : "No extra relievers listed" }
  ].forEach((item) => {
    const cell = document.createElement("div");
    cell.className = "pitching-summary-cell";
    cell.innerHTML = `<div class="dugout-slot">${item.label}</div><div>${item.value}</div>`;
    wrap.appendChild(cell);
  });

  container.appendChild(wrap);
}

function buildCoachTable(container, players) {
  const table = document.createElement("table");
  table.className = "sheet-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Order", "Player", "Inning 1", "Inning 2", "Inning 3", "Inning 4", "Inning 5", "Inning 6"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  players.forEach((player) => {
    const row = document.createElement("tr");
    [String(player.battingOrder), player.name || "Unnamed Player"].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      row.appendChild(td);
    });
    Array.from({ length: INNINGS }, (_, inningIndex) => getPrintablePosition(player, inningIndex)).forEach((value) => {
      const td = document.createElement("td");
      td.classList.add(`position-${getPositionTone(value)}`);
      td.textContent = value;
      if (needsWarmupBall(value)) {
        const icon = document.createElement("span");
        icon.className = "warmup-icon";
        icon.title = "Grab a ball for warmups";
        td.appendChild(icon);
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  container.appendChild(table);
  buildPitchingSummary(container);
}

function buildDugoutBattingOrder(container) {
  const list = document.createElement("div");
  list.className = "dugout-list";
  getPlayersByBattingOrder().forEach((player) => {
    const row = document.createElement("div");
    row.className = "dugout-row";
    row.innerHTML = `<div class="dugout-slot">${player.battingOrder}</div><div>${player.name || "Unnamed Player"}</div>`;
    list.appendChild(row);
  });
  container.appendChild(list);

  const responsibilities = document.createElement("div");
  responsibilities.className = "dugout-responsibilities";
  responsibilities.innerHTML = `
    <div><strong>Batter:</strong> hit dingers</div>
    <div><strong>On deck:</strong> watching pitcher</div>
    <div><strong>In the hole:</strong> getting ready</div>
  `;
  container.appendChild(responsibilities);

}

function buildPositionChartByOrder(container) {
  const table = document.createElement("table");
  table.className = "sheet-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Order", "Player", "Inning 1", "Inning 2", "Inning 3", "Inning 4", "Inning 5", "Inning 6"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  getPlayersByBattingOrder().forEach((player) => {
    const row = document.createElement("tr");
    [String(player.battingOrder), player.name || "Unnamed Player"].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      row.appendChild(td);
    });
    Array.from({ length: INNINGS }, (_, inningIndex) => getPrintablePosition(player, inningIndex)).forEach((value) => {
      const td = document.createElement("td");
      td.classList.add(`position-${getPositionTone(value)}`);
      td.textContent = value;
      if (needsWarmupBall(value)) {
        const icon = document.createElement("span");
        icon.className = "warmup-icon";
        icon.title = "Grab a ball for warmups";
        td.appendChild(icon);
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.append(thead, tbody);
  container.appendChild(table);
}

function renderPrintSheets() {
  printSheets.innerHTML = "";
  [
    createSheetCard("Coach Sheet: Batting Order", "Players listed in batting order with positions by inning.", (container) => {
      buildCoachTable(container, getPlayersByBattingOrder());
    }),
    createSheetCard("Coach Sheet: Alphabetical", "Players listed alphabetically by first name with inning assignments.", (container) => {
      buildCoachTable(container, getPlayersAlphabetically());
    }),
    createSheetCard("Dugout Batting Order", "Single-page batting order to post in the dugout.", (container) => {
      buildDugoutBattingOrder(container);
    }),
    createSheetCard("Positions By Batting Order", "Single-page inning-by-inning position chart.", (container) => {
      buildPositionChartByOrder(container);
    })
  ].forEach((sheet) => printSheets.appendChild(sheet));
}

function render() {
  normalizeBattingOrder();
  renderTeamSelectors();
  homeTeamToggle.checked = state.game.ownTeamIsHome;
  teamInput.value = state.game.team;
  opponentInput.value = state.game.opponent;
  locationInput.value = state.game.location;
  dateInput.value = state.game.date;
  timeInput.value = state.game.time;
  springBreakToggle.checked = state.afterSpringBreak;
  renderBranding();
  renderSavedRosterSummary();
  renderRosterEditor();
  renderSavedLineups();
  renderBattingOrder();
  renderPositionsGrid();
  renderValidationSummary();
  renderPrintSheets();
}

springBreakToggle.addEventListener("change", (event) => {
  state.afterSpringBreak = event.target.checked;
  render();
});

homeTeamToggle.addEventListener("change", (event) => handleGameDetailChange("ownTeamIsHome", event.target.checked));
teamInput.addEventListener("change", (event) => handleGameDetailChange("team", event.target.value));
opponentInput.addEventListener("change", (event) => handleGameDetailChange("opponent", event.target.value));
locationInput.addEventListener("change", (event) => handleGameDetailChange("location", event.target.value));
dateInput.addEventListener("change", (event) => handleGameDetailChange("date", event.target.value));
timeInput.addEventListener("change", (event) => handleGameDetailChange("time", event.target.value));

addPlayerButton.addEventListener("click", addPlayer);
randomizeOrderButton.addEventListener("click", randomizeBattingOrder);
saveRosterButton.addEventListener("click", saveCurrentRoster);
restoreRosterButton.addEventListener("click", restoreSavedRoster);
saveLineupButton.addEventListener("click", saveCurrentLineup);
resetButton.addEventListener("click", resetDemoRoster);
printButton.addEventListener("click", () => window.print());

loadSavedLineups();
loadSavedRoster();
resetDemoRoster();
