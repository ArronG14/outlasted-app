# OUTLASTED - Premium Football Survival Game

A modern, premium football prediction survival game where players compete to be the last one standing and claim the prize pot.

## Features

- **Survival Gameplay**: Pick one team per gameweek, survive to continue
- **No Team Reuse**: Strategic decision-making with limited team selections
- **Private & Public Rooms**: Create exclusive leagues or join public competitions
- **Real Stakes**: Buy-in system with winner-takes-all prize pots
- **Deal System**: Propose pot splits as numbers dwindle
- **Live Dashboard**: Track active games, countdowns, and history

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Backend**: Supabase (Auth, Database, RLS)
- **Deployment**: Netlify
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file with your Supabase credentials
   echo "VITE_SUPABASE_URL=your_supabase_project_url" > .env
   echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env
    echo "SUPABASE_URL=your_supabase_project_url" >> .env
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" >> .env
   echo "VITE_APP_NAME=OUTLASTED" >> .env
   echo "VITE_APP_VERSION=1.0.0" >> .env
   ```

3. **Set up database schema and functions:**
   - Run the existing migration file `20250831180918_shy_fountain.sql` in your Supabase SQL editor if not already applied
   - Run the new room functions migration `create_room_functions.sql` in your Supabase SQL editor
    - Run the FPL tables migration `create_fpl_tables.sql` in your Supabase SQL editor
    - (Optional) Run the seed script `scripts/seed-fpl-data.sql` for local development data

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
    - `SUPABASE_URL` (same as VITE_SUPABASE_URL)
    - `SUPABASE_SERVICE_ROLE_KEY` (for scheduled functions)
3. **Deploy** - Netlify will use the `netlify.toml` configuration

### FPL Data Integration

The app includes a scheduled Netlify function that syncs Premier League data:

- **Scheduled Function**: `netlify/functions/sync-fpl.ts` runs hourly
- **Data Sources**: FPL API endpoints (server-side only)
- **Storage**: Cached in Supabase tables (`pl_teams`, `gameweeks`, `fixtures`)
- **Security**: Service role key used only in server functions

#### Manual Sync

You can manually trigger the sync function:
```bash
# Using Netlify CLI
netlify functions:invoke sync-fpl

# Or via HTTP (after deployment)
curl -X POST https://your-app.netlify.app/.netlify/functions/sync-fpl
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI elements (Button, Input, etc.)
│   ├── auth/           # Authentication components
│   ├── landing/        # Landing page components
│   └── rooms/          # Room management components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configuration
│   ├── design-tokens.ts # Color palette and spacing
│   └── supabase.ts     # Supabase client setup
├── services/           # API service layers
│   ├── fplService.ts   # FPL data service
│   ├── profileService.ts # User profile service
│   └── roomService.ts  # Room management service
├── types/              # TypeScript type definitions
│   ├── database.ts     # Database types
│   └── fpl.ts          # FPL data types
├── pages/              # Main application pages
│   ├── Landing.tsx     # Landing page with auth
│   ├── Dashboard.tsx   # Main dashboard
│   ├── JoinPage.tsx    # Join room page
│   ├── InvitePage.tsx  # Invite link handler
│   └── RoomPage.tsx    # Individual room view
└── scripts/            # Database seed scripts
```

### Netlify Functions

```
netlify/
└── functions/
    └── sync-fpl.ts     # Scheduled FPL data sync
```

## Design System

The app uses a carefully crafted design token system to ensure pixel-perfect consistency:

- **Colors**: Premium palette with Neon Jade primary (#00E5A0)
- **Typography**: Inter font with consistent weight hierarchy
- **Spacing**: 8px base grid system
- **Components**: Consistent shadows, border radius, and animations

## Database Schema

The application uses Supabase with Row Level Security (RLS) enabled. Key tables include:

- **profiles**: User data and statistics
- **rooms**: Game rooms with settings and status
- **room_players**: Player participation and status
- **picks**: Team selections per gameweek
- **pl_teams**: Premier League teams cache
- **gameweeks**: Gameweek deadlines and status
- **fixtures**: Match fixtures with kickoff times

### Database Functions (RPCs)

- **create_room**: Creates a room and auto-joins the host
- **join_room**: Joins a room by code or ID with validation
- **public_rooms_view**: View of public rooms with player counts

### FPL Data Services

- **listUpcomingGameweeks()**: Get current and future gameweeks
- **listFixtures(gw)**: Get fixtures for a specific gameweek
- **getNextDeadline()**: Get next pick deadline with countdown
- **arePicksLocked(gw)**: Check if picks are locked for gameweek

- `/` - Landing page with authentication
- `/dashboard` - Main dashboard with room management
- `/join` - Join room page with public/private tabs
- `/invite/:code` - Invite link handler with auto-join
- `/rooms/:id` - Individual room view with host panel

## Features Implemented

### Room Management
- Create public/private rooms with custom settings
- Join public rooms from a browsable list
- Join private rooms with invite codes
- Auto-generated or custom room codes
- Host panel with invite link management

### Authentication Flow
- Enhanced sign-up with username validation
- Invite link handling with authentication redirect
- Profile management with display names

### User Experience
- Pixel-perfect design matching existing tokens
- Real-time room capacity checking
- Copy-to-clipboard invite links
- Comprehensive error handling
- Success notifications and feedback
- Live countdown timers for pick deadlines
- Fixture-based team selection interface

## Security

- All database operations use RLS policies
- Client-side operations limited to user's own data
- Server functions handle privileged operations
- No hardcoded secrets or API keys
- Secure authentication via Supabase Auth
- FPL data sync uses service role key (server-only)

## Performance

- Optimized for Core Web Vitals
- Lazy loading for route components
- Efficient state management
- Minimal bundle size with tree-shaking
- Cached FPL data reduces third-party API calls
- Hourly data sync keeps information current

## Contributing

1. Follow the established design token system
2. Maintain pixel-perfect design parity
3. Write TypeScript for all new code
4. Test authentication flows thoroughly
5. Ensure mobile responsiveness

## License

© 2025 OUTLASTED. All rights reserved.