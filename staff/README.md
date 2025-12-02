# ALEF DELTA ERP - Staff Website

Production-grade HQ Admin Dashboard for ALEF DELTA ERP built with Vite + React + TypeScript.

## Features

- 🎨 Modern UI with Tailwind CSS and shadcn/ui components
- 🌓 Dark mode support
- 📱 Responsive design (desktop-first, mobile-friendly)
- 🔐 JWT authentication with role-based access control
- 📊 Data visualization with Recharts
- 🗺️ Interactive maps with Leaflet
- 📅 Calendar-based roster management
- ⚡ Fast development with Vite HMR

## Prerequisites

- Node.js 22.17.0 or higher
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
copy .env.example .env
```

Update `.env` with your backend API URL:

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=ALEF DELTA ERP
```

### 3. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

Create a production build:

```bash
npm run build
```

The build output will be in the `/dist` directory.

### 5. Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
staff/
├── public/              # Static assets
├── src/
│   ├── api/            # API client and endpoint modules
│   ├── components/     # Reusable components
│   │   ├── ui/         # shadcn/ui primitives
│   │   ├── layout/     # Layout components
│   │   └── domain/     # Domain-specific components
│   ├── features/       # Feature modules
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   ├── routes/         # Route configuration
│   ├── services/       # React Query hooks
│   ├── store/          # Zustand stores
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── .env.example        # Environment variables template
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## Technologies

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router v6
- **State Management**: React Query + Zustand
- **Forms**: react-hook-form + zod
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Development Guidelines

### Component Development

- Use TypeScript for all components
- Follow the shadcn/ui pattern for UI primitives
- Keep components focused and reusable
- Add prop types and JSDoc comments

### Styling

- Use Tailwind utility classes
- Follow the design system tokens in `tailwind.config.js`
- Use the `cn()` utility for conditional class names
- Prefer composition over custom CSS

### State Management

- Use React Query for server state
- Use Zustand for global UI state
- Use local useState for component-specific state

### API Integration

- Create typed endpoint functions in `/api/endpoints`
- Use React Query hooks in `/services`
- Define TypeScript interfaces in `/types`

## Deployment

### cPanel Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Upload the `/dist` folder contents to your cPanel public directory

3. Configure your web server to serve `index.html` for all routes

### Environment Variables

Ensure your production environment has the following variables set:

- `VITE_API_URL` - Your Laravel backend API URL
- `VITE_APP_NAME` - Application name

## License

© 2024 ALEF DELTA. All rights reserved.
