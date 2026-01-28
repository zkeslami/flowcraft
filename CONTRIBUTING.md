# Contributing to FlowCraft

Thank you for your interest in contributing to FlowCraft! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a branch for your changes
5. Make your changes and test them
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/flowcraft.git
cd flowcraft

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/flowcraft.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
flowcraft/
├── app/                # Next.js App Router pages
├── components/         # React components
│   ├── workflow/      # Workflow-specific components
│   ├── prompt-editor/ # Prompt editing components
│   └── ui/            # shadcn/ui components
├── lib/               # Utility functions and types
├── hooks/             # Custom React hooks
└── public/            # Static assets
```

## How to Contribute

### Types of Contributions

- **Bug Fixes**: Fix issues reported in the issue tracker
- **Features**: Implement new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Accessibility**: Improve accessibility features

### Good First Issues

Look for issues labeled `good first issue` if you're new to the project. These are typically smaller, well-defined tasks suitable for newcomers.

## Pull Request Process

### Before Submitting

1. **Update your fork**: Sync with the upstream repository
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a branch**: Use a descriptive branch name
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make changes**: Follow the coding standards below

4. **Test your changes**: Ensure everything works
   ```bash
   npm run lint
   npm run build
   ```

### Submitting

1. Push your branch to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template with:
   - Description of changes
   - Related issue numbers
   - Screenshots (if UI changes)
   - Testing steps

### Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type
- Export types from dedicated type files

```typescript
// Good
interface WorkflowNode {
  id: string
  type: NodeType
  label: string
}

// Avoid
const node: any = { ... }
```

### React Components

- Use functional components with hooks
- Follow the component file structure:
  ```typescript
  // Imports
  import { useState } from 'react'

  // Types
  interface Props {
    // ...
  }

  // Component
  export function MyComponent({ prop }: Props) {
    // Hooks first
    const [state, setState] = useState()

    // Handlers
    const handleClick = () => {}

    // Render
    return <div>...</div>
  }
  ```

### Styling

- Use Tailwind CSS for styling
- Follow the existing color scheme and design patterns
- Use the `cn()` utility for conditional classes

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)} />
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `WorkflowNode.tsx`)
- Utilities: `kebab-case.ts` (e.g., `workflow-types.ts`)
- Hooks: `use-camelCase.ts` (e.g., `use-toast.ts`)

## Commit Messages

Follow the conventional commits specification:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(nodes): add copy/paste functionality for nodes

fix(canvas): resolve zoom level persistence issue

docs(readme): update installation instructions

refactor(execution): improve span tracing performance
```

## Reporting Bugs

### Before Reporting

1. Search existing issues to avoid duplicates
2. Try to reproduce the bug with the latest version
3. Gather relevant information

### Bug Report Template

When creating an issue, include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**:
  1. Step one
  2. Step two
  3. ...
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**:
  - OS: [e.g., macOS 14.0]
  - Browser: [e.g., Chrome 120]
  - Node.js version: [e.g., 18.19.0]
- **Screenshots**: If applicable
- **Additional Context**: Any other relevant information

## Requesting Features

### Before Requesting

1. Search existing issues and discussions
2. Consider if it aligns with the project's goals
3. Think about potential implementation

### Feature Request Template

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternatives Considered**: Other approaches you've thought about
- **Additional Context**: Mockups, examples, etc.

## Questions?

If you have questions about contributing:

1. Check the documentation
2. Search existing issues and discussions
3. Open a new discussion for general questions
4. Open an issue for specific problems

---

Thank you for contributing to FlowCraft!
