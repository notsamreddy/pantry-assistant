This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

To use the Voice Assistant feature, you'll need to set up the following environment variables in your `.env.local` file:

```bash
# ElevenLabs API Key for text-to-speech
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional: ElevenLabs Voice ID (defaults to Rachel if not set)
ELEVENLABS_VOICE_ID=your_voice_id_here

# Google Maps API Key for geocoding (OPTIONAL - free Nominatim is used if not set)
# If not provided, the app will use free OpenStreetMap Nominatim service
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Default city/state to append when users only provide street addresses
# Defaults to "Syracuse, NY" if not set
DEFAULT_CITY_STATE=Syracuse, NY

# Optional: Webhook secret for securing the ElevenLabs agent endpoint
ELEVENLABS_WEBHOOK_SECRET=your_webhook_secret_here
```

### Getting API Keys

1. **ElevenLabs API Key**: 
   - Sign up at [ElevenLabs](https://elevenlabs.io/)
   - Go to your profile settings and generate an API key
   - Optionally, choose a voice ID from their voice library

2. **Google Maps API Key (OPTIONAL)**:
   - **Free Alternative**: The app uses **Nominatim (OpenStreetMap)** by default - completely free, no API key needed!
   - **If you want to use Google Maps** (more accurate, faster, but costs money):
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select an existing one
     - Enable the "Geocoding API"
     - Create credentials (API Key)
     - Restrict the API key to only the Geocoding API for security
   - **Note**: Nominatim has a rate limit of 1 request per second, but it's completely free and works great for most use cases

## Voice Assistant Feature

The Voice Assistant allows users to:
- Speak their address to the agent
- Get the nearest pantry location based on their address
- Receive audio responses with pantry information

The assistant uses:
- **Web Speech API** for speech-to-text (works in Chrome/Edge)
- **ElevenLabs** for natural text-to-speech
- **Google Maps Geocoding API** to convert addresses to coordinates
- **Distance calculations** to find the nearest pantry

## ElevenLabs Agent Integration

**Important:** This API endpoint is designed for backend-only use. Users will **never access this website directly**. They will only interact with your ElevenLabs agent through the ElevenLabs platform/dashboard. The agent will call this API endpoint to find the nearest pantry and speak the response to users.

### API Endpoint

**URL:** `https://your-domain.com/api/elevenlabs/agent?default_location=Syracuse, NY`

**Method:** `POST`

**Query Parameters (Optional):**
- `default_location`: Automatically appends this location to incomplete addresses (e.g., "Syracuse, NY")
- `default_city`: Alternative parameter name (same as `default_location`)

**Request Format:**
```json
{
  "message": "123 Main Street, New York, NY 10001",
  "conversation_id": "optional-conversation-id"
}
```

**Response Format:**
```json
{
  "response": "The nearest pantry to you is Food Bank NYC, located at 123 Main Street. It's about 2.5 kilometers away. You can contact them at (555) 123-4567. They typically have items like canned goods, pasta, rice, beans."
}
```

### Setting Up in ElevenLabs Dashboard

**📖 For detailed step-by-step instructions, see [ELEVENLABS_SETUP.md](./ELEVENLABS_SETUP.md)**

Quick setup:
1. Go to your ElevenLabs dashboard → Agents section
2. Create or select an agent
3. Navigate to Tools/Integrations section
4. Add a new custom tool with:
   - **Name:** Find Nearest Pantry
   - **URL:** `https://your-domain.com/api/elevenlabs/agent`
   - **Method:** POST
   - **Request Body:** `{ "message": "user's address" }`
5. Update your agent's system prompt to instruct it to use this tool when users provide addresses
6. Test the integration

### Optional: Webhook Security

For added security, you can set an `ELEVENLABS_WEBHOOK_SECRET` environment variable. If set, the endpoint will require an `Authorization: Bearer <secret>` header.

```bash
ELEVENLABS_WEBHOOK_SECRET=your_secret_key_here
```

### How It Works

1. User tells ElevenLabs agent their address
2. ElevenLabs sends the address to `/api/elevenlabs/agent`
3. API geocodes the address using Google Maps
4. API fetches all active pantries from the database
5. API calculates distances and finds the nearest pantry
6. API returns a formatted text response
7. ElevenLabs agent speaks the response to the user

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
