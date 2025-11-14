# ElevenLabs Agent Setup Guide

This guide will walk you through adding your pantry finder API as a custom tool to your ElevenLabs agent.

## Prerequisites

1. ✅ Your API endpoint is deployed and accessible (e.g., `https://your-domain.com/api/elevenlabs/agent`)
2. ✅ You have an ElevenLabs account with access to the Agents Platform
3. ✅ Your API keys are configured (Google Maps API, Convex URL, etc.)

## Step-by-Step Instructions

### Step 1: Access ElevenLabs Agents Platform

1. Log in to your [ElevenLabs account](https://elevenlabs.io/)
2. Navigate to the **Agents** section in the dashboard
3. Either:
   - **Create a new agent** (if you don't have one yet), OR
   - **Select an existing agent** to add the tool to

### Step 2: Navigate to Tools/Integrations Section

1. In your agent's settings page, look for:
   - **"Tools"** tab/section
   - **"Integrations"** section
   - **"Custom Functions"** or **"Webhooks"** option
   - **"Functions"** in the agent configuration

2. Click on **"Add Tool"**, **"Add Function"**, or **"Add Integration"** button

### Step 3: Configure the Custom Tool

Fill in the following details:

#### **Tool Name:**
```
Find Nearest Pantry
```

#### **Tool Description:**
```
Finds the nearest food pantry to a user's address. The user provides their address, and the tool returns information about the closest pantry including its name, address, distance, phone number, inventory, and hours of operation.
```

#### **Endpoint URL:**
```
https://your-domain.com/api/elevenlabs/agent?default_location=Syracuse, NY
```
*(Replace `your-domain.com` with your actual deployed domain)*

**Note:** The `default_location` query parameter tells the API to automatically append "Syracuse, NY" to incomplete addresses. This is useful for testing when all pantries are in Syracuse.

#### **HTTP Method:**
```
POST
```

#### **Request Format:**

**Headers:**
```
Content-Type: application/json
```

**Optional Authentication Header** (if you set `ELEVENLABS_WEBHOOK_SECRET`):
```
Authorization: Bearer YOUR_WEBHOOK_SECRET
```

**Request Body:**
```json
{
  "message": "123 Main Street, New York, NY 10001"
}
```

**Alternative field names that also work:**
- `text`
- `user_input`
- `input`
- `query`
- `transcript`
- `content`

#### **Response Format:**

The API returns:
```json
{
  "response": "The nearest pantry to you is Food Bank NYC, located at 123 Main Street. It's about 2.5 kilometers away. You can contact them at (555) 123-4567. They typically have items like canned goods, pasta, rice, beans."
}
```

### Step 4: Configure Parameters (if required)

If ElevenLabs asks you to define parameters, configure:

**Parameter Name:** `address` or `message`
- **Type:** `string`
- **Description:** `The user's address or location`
- **Required:** `Yes`

### Step 5: Update System Prompt

Add instructions to your agent's system prompt so it knows when to use this tool:

```
You are a helpful assistant that helps people find the nearest food pantry in Syracuse, New York.

IMPORTANT: All pantries are located in Syracuse, NY. When a user provides their address, if they only give you a street address (like "112 Alden Street"), you should assume they mean Syracuse, NY and include that in the address you send to the tool. For example, if they say "112 Alden Street", you should send "112 Alden Street, Syracuse, NY" to the tool.

When a user provides their address or location, use the "Find Nearest Pantry" tool to search for nearby pantries.

Always ask the user for their address if they haven't provided it yet. Once you have the address, use the tool to find the nearest pantry and provide them with all the information including:
- Pantry name
- Address
- Distance
- Phone number (if available)
- Available inventory
- Hours of operation (if available)

Speak naturally and conversationally when providing this information.
```

**Alternative:** Instead of modifying the system prompt, you can add `?default_location=Syracuse, NY` to the endpoint URL (see Step 3), and the API will automatically append it to incomplete addresses.

### Step 6: Test the Integration

1. **Save your tool configuration**

2. **Test the connection:**
   - Some dashboards have a "Test" button - use it to verify the endpoint is reachable
   - Check that you get a valid response

3. **Test with a conversation:**
   - Start a conversation with your agent
   - Say something like: *"I need to find a pantry. My address is 123 Main Street, New York, NY 10001"*
   - The agent should:
     - Recognize you've provided an address
     - Call the custom tool
     - Receive the pantry information
     - Speak the response back to you

### Step 7: Verify It's Working

**Expected Flow:**
1. User: *"I need food assistance. I live at 456 Oak Avenue, Los Angeles, CA 90001"*
2. Agent: *"Let me find the nearest pantry to you..."*
3. Agent calls your API with the address
4. Agent: *"The nearest pantry to you is [Pantry Name], located at [Address]. It's about [Distance] kilometers away. You can contact them at [Phone]. They typically have items like [Inventory]."*

## Troubleshooting

### Issue: "Tool not being called"

**Solutions:**
- Check that the system prompt clearly instructs the agent to use the tool
- Verify the tool description is clear about when to use it
- Test the endpoint directly with a tool like Postman or curl

### Issue: "401 Unauthorized"

**Solutions:**
- If you set `ELEVENLABS_WEBHOOK_SECRET`, make sure you've configured the Authorization header in ElevenLabs
- Or remove the webhook secret requirement temporarily for testing

### Issue: "Endpoint not reachable"

**Solutions:**
- Verify your deployment is live and accessible
- Check that the URL is correct (no typos)
- Ensure CORS is properly configured (we've already added this)
- Test the endpoint directly: `curl -X POST https://your-domain.com/api/elevenlabs/agent -H "Content-Type: application/json" -d '{"message":"123 Main St, New York, NY"}'`

### Issue: "No pantries found"

**Solutions:**
- Make sure you have active pantries in your database
- Check that the Convex HTTP action is working: `https://your-convex-url/api/actions/pantries:listHttp`
- Verify your Google Maps API key is valid

### Issue: "Address not recognized"

**Solutions:**
- The geocoding API handles natural language, but very vague addresses might fail
- The agent should ask the user to provide a more complete address
- Test with a full address including city and state

## Testing Your Endpoint Manually

Before adding to ElevenLabs, test your endpoint:

```bash
# Test with full address
curl -X POST "https://your-domain.com/api/elevenlabs/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "123 Main Street, Syracuse, NY 13201"
  }'

# Test with query parameter for default location (Syracuse addresses)
curl -X POST "https://your-domain.com/api/elevenlabs/agent?default_location=Syracuse, NY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "112 Alden Street"
  }'
```

**Expected Response:**
```json
{
  "response": "The nearest pantry to you is [Name], located at [Address]. It's about [Distance] kilometers away..."
}
```

**Note:** When using `?default_location=Syracuse, NY`, addresses like "112 Alden Street" will automatically become "112 Alden Street, Syracuse, NY".

## Health Check

You can also test the health endpoint:

```bash
curl https://your-domain.com/api/elevenlabs/agent
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "ElevenLabs agent webhook is ready",
  "endpoint": "/api/elevenlabs/agent"
}
```

## Additional Configuration Options

### Optional: Add Webhook Secret for Security

If you want to secure your endpoint:

1. Set in your `.env.local`:
   ```bash
   ELEVENLABS_WEBHOOK_SECRET=your_secret_key_here
   ```

2. In ElevenLabs dashboard, add this header:
   ```
   Authorization: Bearer your_secret_key_here
   ```

### Customizing the Response

You can modify the response format in `/src/app/api/elevenlabs/agent/route.ts` to change:
- How distances are displayed (km vs miles)
- What information is included
- The tone and format of the response

## Next Steps

Once your tool is configured:

1. ✅ Test thoroughly with various addresses
2. ✅ Monitor the agent's usage in ElevenLabs dashboard
3. ✅ Check your server logs for any errors
4. ✅ Gather user feedback and refine the responses
5. ✅ Consider adding more features (e.g., multiple pantries, filtering by inventory)

## Support

If you encounter issues:
- Check the ElevenLabs [Agents Documentation](https://elevenlabs.io/docs/agents-platform)
- Review your server logs for error messages
- Test the endpoint independently before troubleshooting the integration

