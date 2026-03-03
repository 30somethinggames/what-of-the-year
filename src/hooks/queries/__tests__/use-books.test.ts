import { describe, expect, it } from "bun:test";

import { formBookOptions } from "../use-books";

const mockBook = {
  id: "abc123",
  volumeInfo: {
    title: "Test Book",
    publishedDate: "2024-01-15",
    description: "Test summary",
    imageLinks: {
      thumbnail: "http://books.google.com/test.jpg",
    },
    averageRating: 4.5,
  },
};

const mockBookWithoutThumbnail = {
  id: "def456",
  volumeInfo: {
    title: "Test Book 2",
    publishedDate: "2024-03-10",
    description: "Book without thumbnail",
  },
};

describe("formBookOptions", () => {
  it("should transform books to Option format", () => {
    const result = formBookOptions([mockBook])[0];

    expect(typeof result.id).toBe("number");
    expect(result.name).toBe("Test Book");
    expect(result.cover).toBe("https://books.google.com/test.jpg"); // http → https
    expect(result.rating).toBe(90); // 4.5 * 20
    expect(result.first_release_date).toBe(new Date("2024-01-15").getTime() / 1000);
    expect(result.summary).toBe("Test summary");
  });

  it("should handle missing thumbnail", () => {
    const result = formBookOptions([mockBookWithoutThumbnail])[0];

    expect(result.cover).toBeUndefined();
  });
});
