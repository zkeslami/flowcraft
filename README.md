# FlowCraft - Visual Workflow Designer

A powerful, node-based visual workflow designer for building and executing automated workflows with AI agent integration. Built with Next.js 16, React 19, and TypeScript.

![FlowCraft](./public/placeholder-logo.svg)

## Features

- **Visual Node Editor** - Drag-and-drop interface for designing workflows
- **Multiple Node Types** - Trigger, Function, Condition, Action, and AI Agent nodes
- **AI Agent Integration** - Configure LLM-powered agents with tools and context
- **Real-time Execution** - Run workflows and watch execution progress
- **Execution Tracing** - Detailed span-level execution history and debugging
- **Code Editor** - Built-in code editing for function nodes
- **Properties Panel** - Configure node inputs, outputs, and variables
- **Multi-tab Workflow Editing** - Work on multiple workflows simultaneously
- **Dark Theme** - Modern dark UI with excellent readability

## Node Types

| Type | Description |
|------|-------------|
| **Trigger** | Entry points for workflows (webhooks, schedules, events) |
| **Function** | Custom code execution with Node.js runtime |
| **Condition** | Branching logic based on expressions |
| **Action** | External service integrations |
| **Agent** | AI-powered nodes with LLM configuration |

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/flowcraft.git
cd flowcraft
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

## Project Structure

```
flowcraft/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main entry point
│   └── globals.css        # Global styles
├── components/
│   ├── workflow/          # Workflow-specific components
│   │   ├── enhanced-workflow-canvas-v8.tsx
│   │   ├── enhanced-workflow-node-v8.tsx
│   │   ├── properties-panel-v7.tsx
│   │   ├── ai-sidebar-v5.tsx
│   │   ├── run-history-panel.tsx
│   │   ├── spans-list.tsx
│   │   └── span-details.tsx
│   ├── prompt-editor/     # Prompt editing components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── workflow-types.ts  # TypeScript interfaces
│   ├── execution-types.ts # Execution types
│   ├── mock-execution-data.ts
│   └── utils.ts
├── hooks/                  # Custom React hooks
└── public/                # Static assets
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI based)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## Configuration

The project uses the following configuration files:

- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `components.json` - shadcn/ui configuration
- `postcss.config.mjs` - PostCSS/Tailwind configuration

## Environment Variables

Create a `.env.local` file for local development:

```env
# Add your environment variables here
# Example:
# OPENAI_API_KEY=your-key-here
```

## Browser Support

FlowCraft supports all modern browsers:

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Lucide](https://lucide.dev/) for the icon set
- [Vercel](https://vercel.com/) for the deployment platform
