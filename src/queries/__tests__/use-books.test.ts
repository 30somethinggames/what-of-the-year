import { describe, expect, it } from "bun:test";

import { formBookOptions } from "../transforms";

const mockBook = {
  key: "/works/OL12345W",
  title: "Test Book",
  first_publish_year: 2024,
  cover_i: 14641117,
  ratings_average: 4.5,
  description: "Test summary",
};

const mockBookWithoutCover = {
  key: "/works/OL67890W",
  title: "Test Book 2",
  first_publish_year: 2024,
  description: "Book without cover",
};

describe("formBookOptions", () => {
  it("should transform books to Option format", () => {
    const result = formBookOptions([mockBook])[0];

    expect(result.id).toBe(14641117);
    expect(result.name).toBe("Test Book");
    expect(result.cover).toBe("https://covers.openlibrary.org/b/id/14641117-M.jpg");
    expect(result.rating).toBe(90); // 4.5 * 20
    expect(result.first_release_date).toBe(2024);
    expect(result.summary).toBe("Test summary");
  });

  it("should handle missing cover", () => {
    const result = formBookOptions([mockBookWithoutCover])[0];

    expect(result.cover).toBeUndefined();
  });

  it("should fall back to key-derived id when no cover_i", () => {
    const result = formBookOptions([mockBookWithoutCover])[0];

    expect(result.id).toBe(67890);
  });
});
