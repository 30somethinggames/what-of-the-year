# Changelog

## [0.1.0](https://github.com/30somethinggames/what-of-the-year/compare/v0.0.1...v0.1.0) (2026-09-23)


### Features

* **verify:** a local backend per checkout, a browser for the agent, and the recipe for recording a change into its PR ([#245](https://github.com/30somethinggames/what-of-the-year/issues/245)) ([6667668](https://github.com/30somethinggames/what-of-the-year/commit/6667668b855b07fb201146a4f092e61d1eb1e43f))


### Bug Fixes

* **auth:** sign in anonymously once per page load ([#157](https://github.com/30somethinggames/what-of-the-year/issues/157)) ([0074e08](https://github.com/30somethinggames/what-of-the-year/commit/0074e08dfb4a85e601e60c10ff35b926a6325570))
* **backend:** the local backend task ignores a cloud deployment named in the environment ([#259](https://github.com/30somethinggames/what-of-the-year/issues/259)) ([e4cc1b0](https://github.com/30somethinggames/what-of-the-year/commit/e4cc1b067823f910f6b81cbab932968f31428121))
* **roster:** only the host sees the remove ✕ ([#280](https://github.com/30somethinggames/what-of-the-year/issues/280)) ([dfdcdde](https://github.com/30somethinggames/what-of-the-year/commit/dfdcdde620b5d5bd5f2c46d073a02e5cc835816c))
* **session:** drive the screen from the server phase instead of the URL ([#153](https://github.com/30somethinggames/what-of-the-year/issues/153)) ([eec602e](https://github.com/30somethinggames/what-of-the-year/commit/eec602eef373bce07cc87b012b32d920f39a4e75))
* **ui:** toast kick failures instead of firing the mutation and forgetting ([#151](https://github.com/30somethinggames/what-of-the-year/issues/151)) ([ca4427d](https://github.com/30somethinggames/what-of-the-year/commit/ca4427d66d2cb53cf6cd1ea2b46570495b55ae73)), closes [#88](https://github.com/30somethinggames/what-of-the-year/issues/88)


### CI

* **checks:** fail on flaky e2e, job timeouts, coverage floor ([#175](https://github.com/30somethinggames/what-of-the-year/issues/175)) ([0abe23e](https://github.com/30somethinggames/what-of-the-year/commit/0abe23ea6e459383ca185ec2563d5ef1cdd3d41e))
* **e2e:** cut CI wall-clock by parallelising jobs and trimming e2e setup ([#156](https://github.com/30somethinggames/what-of-the-year/issues/156)) ([1e407b0](https://github.com/30somethinggames/what-of-the-year/commit/1e407b0e860803cc0fcd0dd742d3452f9351a67e))
* **e2e:** fail when convex/_generated drifts ([#199](https://github.com/30somethinggames/what-of-the-year/issues/199)) ([8b1085c](https://github.com/30somethinggames/what-of-the-year/commit/8b1085c0b8a9e96d3c8043afbaea1a1d4e439812))
* **e2e:** run e2e against a per-run Convex preview deployment ([#183](https://github.com/30somethinggames/what-of-the-year/issues/183)) ([7bdd026](https://github.com/30somethinggames/what-of-the-year/commit/7bdd02613d82ae869aa52e0499b79f1d79a50706))
* **e2e:** the run deletes the preview deployment it created ([#275](https://github.com/30somethinggames/what-of-the-year/issues/275)) ([23a10a0](https://github.com/30somethinggames/what-of-the-year/commit/23a10a0c42e9dc96e03cadd6352554391d23ef62))
* **release:** adopt release-please for versioned releases ([#152](https://github.com/30somethinggames/what-of-the-year/issues/152)) ([db51696](https://github.com/30somethinggames/what-of-the-year/commit/db51696793e5a2c6cee63e9889dfb9cb78d20596))
* **rules:** accept the full Conventional Commits type set ([#196](https://github.com/30somethinggames/what-of-the-year/issues/196)) ([71937f9](https://github.com/30somethinggames/what-of-the-year/commit/71937f9ba880e22c17d48fd3162f1e2f97452b40))
