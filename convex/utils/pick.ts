interface Option {
  id: number;
  name: string;
  cover?: string;
  rating?: number;
  first_release_date?: number;
  summary?: string;
}

export function buildPickArg(option: Option) {
  return {
    id: String(option.id),
    name: option.name,
    cover: option.cover?.startsWith("//") ? `https:${option.cover}` : option.cover,
    rating: option.rating,
    first_release_date: option.first_release_date,
    summary: option.summary,
  };
}
