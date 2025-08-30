# Fit4Life Setup Guide

## 🚀 Quick Setup

### 1. Add OpenAI API Key (Optional but Recommended)

To enable AI-powered conversations and voice features, add your OpenAI API key:

1. **Get an OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Sign up or log in
   - Go to API Keys section
   - Create a new API key

2. **Add to Environment Variables**:
   ```bash
   # Add this line to your .env.local file
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Restart the Development Server**:
   ```bash
   pnpm dev
   ```

### 2. Current Status

- ✅ **App Running**: The app is currently running in "Basic Mode"
- ✅ **Voice Features**: Speech recognition and synthesis work without OpenAI
- ✅ **Database**: Supabase integration is working
- ✅ **Authentication**: User authentication is functional

### 3. Features Available

#### Without OpenAI API Key (Current Mode):
- ✅ Basic conversation interface
- ✅ Voice input/output
- ✅ Pain level extraction
- ✅ Session tracking
- ✅ Database logging
- ⚠️ Limited AI responses

#### With OpenAI API Key (Enhanced Mode):
- ✅ All basic features
- ✅ Intelligent AI conversations
- ✅ Personalized exercise recommendations
- ✅ Context-aware responses
- ✅ Advanced pain assessment
- ✅ Professional physiotherapy guidance

### 4. How to Enable AI Features

1. **Stop the development server** (Ctrl+C)
2. **Add your OpenAI API key** to `.env.local`
3. **Restart the server**: `pnpm dev`
4. **Check the status**: Look for "Fit4Life AI Assistant" instead of "Fit4Life Assistant"

### 5. Troubleshooting

#### App won't start:
- Check that all environment variables are set correctly
- Ensure Supabase project is active
- Verify database tables are created

#### Voice features not working:
- Use Chrome, Safari, or Edge browser
- Allow microphone permissions
- Check if HTTPS is enabled (required for production)

#### AI responses not working:
- Verify OpenAI API key is correct
- Check API key has sufficient credits
- Ensure internet connection is stable

### 6. Environment Variables Reference

```env
# Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for AI features
OPENAI_API_KEY=your_openai_api_key_here
```

### 7. Next Steps

1. **Test Basic Features**: Try voice input and basic conversation
2. **Add OpenAI Key**: Enable AI features for enhanced experience
3. **Explore Voice Settings**: Customize speech rate, pitch, and voice
4. **Test Pain Assessment**: Describe pain levels and locations
5. **Try Exercise Recommendations**: Ask for exercise suggestions

---

**Need Help?** Check the main README.md for detailed documentation or create an issue in the repository.
