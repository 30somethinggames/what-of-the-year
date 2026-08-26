---
paths:
  - "src/**/*.{tsx,css}"
---

# Styling rules

- Use only design tokens from `src/index.css` `@theme`: colors `black-100 / grey-100 / white-100 / white-200 / red-100 / blue-100 / green-100 / yellow-100`, spacing `sm|md|lg`, text `sm|md|lg|xl`, radii `sm|md|lg`. Never raw hex, arbitrary px values, or default Tailwind palette shades.
- If a needed value has no token: add one to `@theme` following the existing naming scheme (`<color>-100` steps, `sm|md|lg` scales) and call it out in the PR description. Never inline the value instead.
- Topic theming only through the `@utility` classes (`bg-topic`, `text-topic`, `border-topic`, `border-t-topic`, `bg-topic-light`), which resolve from `data-topic` set on the `/$topic` layout. Never hardcode a per-topic color.
