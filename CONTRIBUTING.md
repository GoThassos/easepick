# Contributing

Thanks for helping with easepick. Bug reports and pull requests are welcome.

- **Setting up**: see [Development environment](https://gothassos.github.io/easepick/development/environment) for installing, building and running the docs site.
- **Writing a plugin**: see [Creating plugins](https://gothassos.github.io/easepick/development/plugins).
- **Reporting a bug**: see [Reporting issues](https://gothassos.github.io/easepick/support/reporting-issues).

## Tests

**Any new code that can be tested must come with tests.** That includes bug fixes: add a test that fails without the fix.

Tests live in each package's `__tests__/` folder and run with Jest (jsdom):

```bash
npm test               # run the tests
npm run test:coverage  # run them with a coverage report (coverage/index.html)
```

The packages are at 100% coverage, and CI fails if statements, branches, functions or lines drop below it. If some code really can't be tested in jsdom (for example, it depends on real browser layout), explain why in the pull request so we can agree on how to handle it.

## Before opening a pull request

Run what CI runs:

```bash
npm run lint
npm run prod        # build; type checking reads the built dist/*.d.ts
npm run typecheck
npm run test:coverage
```

If your change affects users, add a line to [CHANGELOG.md](CHANGELOG.md) and update the package's README (its options and methods tables also feed the documentation site).
