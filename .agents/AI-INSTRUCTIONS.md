# Instructions for AI Agents

This documentation helps you understand Community Map. Read this file first.

## How to Find What You Need

1. **Start here**: Read `product-overview.md` for product context
2. **This repo**: Read `project-overview.md` for this repo's role
3. **Find operations**: Search `operations/INDEX.md` for domain operations
4. **Find terminology**: Search `reference/INDEX.md` for definitions
5. **Find patterns**: Search `architecture/INDEX.md` for cross-cutting concerns
6. **Load on-demand**: Only load docs as needed for your task

## Documentation Structure

```
.agents/
├── AI-INSTRUCTIONS.md        # Entry point (this file)
├── product-overview.md       # Product context and terminology
├── project-overview.md       # This repo's role (brief)
├── operations/
│   └── INDEX.md              # Keyword index of domain operations
├── reference/
│   └── INDEX.md              # Keyword index of definitions/lookups
├── architecture/
│   ├── INDEX.md              # Keyword index of patterns
│   └── integrations/
│       └── INDEX.md          # External services this repo depends on
└── scripts/
    ├── lint-docs.js          # Token limit validation
    ├── lint-structure.js     # Structure validation
    └── structure-schema.json # Single source of truth for folder structure
```

## Token Limits

Run `node .agents/scripts/lint-docs.js` to check limits before committing.

| Doc Type | Limit | Purpose |
|----------|-------|---------|
| AI-INSTRUCTIONS.md | 1000 | Entry point |
| product-overview.md | 500 | Product context |
| project-overview.md | 100 | Repo role (brief!) |
| operations/*.md | 500 | Domain operations |
| reference/*.md | 500 | Terminology |
| architecture/*.md | 500 | Patterns |
| **/INDEX.md | 200 | Keyword indexes |

## Templates

### Operations (operations/[domain].md)
Group related operations by domain. Example: users.md covers create, update, delete.

### Reference (reference/[concept].md)
Definitions and lookup tables. No how-to steps.

### Architecture (architecture/[pattern].md)
Cross-cutting patterns: auth, caching, error handling, etc.

### Integrations (architecture/integrations/[service].md)
External services this repo depends on: APIs, databases, queues.

## Writing Rules

1. **Operations = what you can do**: UI "flows", Domain actions, API endpoints, jobs
2. **Reference = definitions**: Reusable lookups, generic domain knowledge, no action steps
3. **Architecture = how things work**: Patterns, not step-by-step
4. **Brief is better**: Stay under token limits, link for details
