import { useQuery } from "@tanstack/react-query";

import { TOPIC_KEY } from "constants/topics";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";
import type { Backend } from "types/backend";

import { DEFAULT_STALE_TIME } from "./constants";
import { formBookOptions } from "./transforms";

const BOOK_QUERY_KEY = TOPIC_KEY.BOOKS;

export const useBooks: Backend["useBooks"] = ({ key, year }) => {
  const enabled = key === BOOK_QUERY_KEY && !!year;
  const getBooks = useAction(api.openlibrary.getBooks);

  return useQuery({
    queryKey: [BOOK_QUERY_KEY, year],
    queryFn: () => getBooks({ year }),
    select: formBookOptions,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
    throwOnError: true,
  });
};
