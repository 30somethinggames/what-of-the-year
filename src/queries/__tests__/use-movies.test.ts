import { describe, expect, it } from "bun:test";

import { formMovieOptions } from "../use-movies";

const mockMovie = {
  id: 1,
  title: "Test Movie",
  poster_path: "/test.jpg",
  popularity: 100.5,
  release_date: "2024-01-15",
  overview: "Test summary",
  vote_average: 8.5,
  vote_count: 1000,
  adult: false,
  backdrop_path: "/backdrop.jpg",
  genre_ids: [28],
  original_language: "en",
  original_title: "Test Movie",
  video: false,
};

const mockMovieWithoutPoster = {
  id: 2,
  title: "Test Movie 2",
  poster_path: "",
  popularity: 50.0,
  release_date: "2024-03-10",
  overview: "Movie without poster",
  vote_average: 6.0,
  vote_count: 100,
  adult: false,
  backdrop_path: "/backdrop.jpg",
  genre_ids: [18],
  original_language: "en",
  original_title: "Test Movie 2",
  video: false,
};

describe("formMovieOptions", () => {
  it("should transform movies to Option format", () => {
    const result = formMovieOptions([mockMovie])[0];

    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Movie");
    expect(result.cover).toBe("https://image.tmdb.org/t/p/w500/test.jpg");
    expect(result.rating).toBe(8.5);
    expect(result.first_release_date).toBe(new Date("2024-01-15").getTime() / 1000);
    expect(result.summary).toBe("Test summary");
  });

  it("should handle missing poster", () => {
    const result = formMovieOptions([mockMovieWithoutPoster])[0];

    expect(result.cover).toBeUndefined();
  });
});
