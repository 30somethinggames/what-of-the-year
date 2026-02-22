import { describe, expect, it } from "bun:test";

import { formBookOptions } from "../use-books";
import { formGameOptions } from "../use-games";
import { formMovieOptions } from "../use-movies";

/**
 * Core test: ensure all transformers produce the same Option structure
 */
describe("Option type consistency", () => {
  it("should return identical structure across games, movies, and books", () => {
    const mockGame = {
      id: 1,
      name: "Test",
      cover: { id: 1, url: "//test.jpg" },
      rating: 80,
      aggregated_rating: 85,
      total_rating: 82.5,
      category: 0,
      first_release_date: 1704067200,
      summary: "Test",
    };

    const mockMovie = {
      id: 1,
      title: "Test",
      poster_path: "/test.jpg",
      popularity: 100,
      release_date: "2024-01-01",
      overview: "Test",
      vote_average: 8.25,
      vote_count: 100,
      adult: false,
      backdrop_path: "/backdrop.jpg",
      genre_ids: [1],
      original_language: "en",
      original_title: "Test",
      video: false,
    };

    const mockBook = {
      id: "test123",
      volumeInfo: {
        title: "Test",
        publishedDate: "2024-01-01",
        description: "Test",
        imageLinks: { thumbnail: "http://test.jpg" },
        averageRating: 4.125,
      },
    };

    const gameOption = formGameOptions([mockGame])[0];
    const movieOption = formMovieOptions([mockMovie])[0];
    const bookOption = formBookOptions([mockBook])[0];

    // All should have the same keys
    const gameKeys = Object.keys(gameOption).sort();
    const movieKeys = Object.keys(movieOption).sort();
    const bookKeys = Object.keys(bookOption).sort();

    expect(gameKeys).toEqual(movieKeys);
    expect(movieKeys).toEqual(bookKeys);

    // All should have the same field types
    expect(typeof gameOption.id).toBe("number");
    expect(typeof movieOption.id).toBe("number");
    expect(typeof bookOption.id).toBe("number");

    expect(typeof gameOption.rating).toBe("number");
    expect(typeof movieOption.rating).toBe("number");
    expect(typeof bookOption.rating).toBe("number");
  });

  it("should handle missing optional fields consistently", () => {
    const gameWithoutCover = {
      id: 1,
      name: "Test",
      rating: 80,
      aggregated_rating: 85,
      total_rating: 82.5,
      category: 0,
      first_release_date: 1704067200,
      summary: "Test",
      cover: undefined,
    };

    const movieWithoutPoster = {
      id: 1,
      title: "Test",
      poster_path: "",
      popularity: 100,
      release_date: "2024-01-01",
      overview: "Test",
      vote_average: 8.0,
      vote_count: 100,
      adult: false,
      backdrop_path: "/backdrop.jpg",
      genre_ids: [1],
      original_language: "en",
      original_title: "Test",
      video: false,
    };

    const bookWithoutThumbnail = {
      id: "test123",
      volumeInfo: {
        title: "Test",
        publishedDate: "2024-01-01",
        description: "Test",
        averageRating: 4.0,
      },
    };

    const gameOption = formGameOptions([gameWithoutCover])[0];
    const movieOption = formMovieOptions([movieWithoutPoster])[0];
    const bookOption = formBookOptions([bookWithoutThumbnail])[0];

    expect(gameOption.cover).toBeUndefined();
    expect(movieOption.cover).toBeUndefined();
    expect(bookOption.cover).toBeUndefined();
  });
});
