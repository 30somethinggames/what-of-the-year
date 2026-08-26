// Deterministic option fixtures served when OPTIONS_FIXTURES is set (hermetic CI).
// Shapes mirror the raw third-party API responses each action normally returns,
// so client transforms run unchanged. One title per letter a-z so any typed
// letter surfaces a suggestion.
const NAMES = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliett",
  "Kilo",
  "Lima",
  "Mike",
  "November",
  "Oscar",
  "Papa",
  "Quebec",
  "Romeo",
  "Sierra",
  "Tango",
  "Uniform",
  "Victor",
  "Whiskey",
  "Xray",
  "Yankee",
  "Zulu",
];

export function fixtureMovies(year: string) {
  return NAMES.map((name, i) => ({
    id: i + 1,
    title: `${name} Picture`,
    poster_path: "",
    vote_average: 7 + (i % 3),
    release_date: `${year}-06-01`,
    overview: `Fixture movie ${name}`,
  }));
}

export function fixtureGames(year: string) {
  const releaseDate = Math.floor(new Date(`${year}-06-01`).getTime() / 1000);
  return NAMES.map((name, i) => ({
    id: i + 1,
    name: `${name} Quest`,
    rating: 70 + (i % 20),
    total_rating: 70 + (i % 20),
    total_rating_count: 100,
    first_release_date: releaseDate,
    summary: `Fixture game ${name}`,
  }));
}

export function fixtureBooks(year: string) {
  return NAMES.map((name, i) => ({
    key: `/works/OL${i + 1}W`,
    title: `${name} Chronicles`,
    first_publish_year: Number(year),
    cover_i: i + 1,
    ratings_average: 3.5 + (i % 3) * 0.5,
    description: `Fixture book ${name}`,
  }));
}
