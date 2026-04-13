# routewatch

A CLI tool that monitors Next.js and Express route changes across commits and generates diff reports for API consumers.

## Installation

```bash
npm install -g routewatch
```

## Usage

Run `routewatch` from the root of your Next.js or Express project to compare route changes between commits:

```bash
# Compare routes between the last two commits
routewatch diff

# Compare routes between two specific commits
routewatch diff --from abc1234 --to def5678

# Watch for route changes and output a JSON report
routewatch diff --from HEAD~1 --to HEAD --format json --output report.json
```

### Example Output

```
[+] POST   /api/v2/users
[-] GET    /api/v1/users/:id
[~] PUT    /api/users/:id  →  /api/v2/users/:id

3 route change(s) detected across 2 file(s).
```

## Supported Frameworks

- **Next.js** – App Router and Pages Router
- **Express** – Static and dynamic route definitions

## Options

| Flag | Description |
|------|-------------|
| `--from` | Starting commit SHA or ref (default: `HEAD~1`) |
| `--to` | Ending commit SHA or ref (default: `HEAD`) |
| `--format` | Output format: `text` or `json` (default: `text`) |
| `--output` | Write report to a file instead of stdout |

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)