# Google Cloud Text-to-Speech Setup Guide

This guide will help you set up Google Cloud Text-to-Speech API for your Lithuanian Vocabulary Builder application.

## 📋 Prerequisites

- A Google account
- A valid credit card or payment method (Google Cloud requires billing setup)
- Internet connection

## 🚀 Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top of the page
   - Click "New Project"
   - Enter project name: `lithuanian-vocabulary-tts`
   - Click "Create"

### Step 2: Enable Text-to-Speech API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   - Or use this direct link: https://console.cloud.google.com/apis/library

2. **Find and Enable Text-to-Speech API**
   - Search for "Text-to-Speech API"
   - Click on "Cloud Text-to-Speech API"
   - Click "Enable" button

### Step 3: Set Up Billing (Required)

1. **Go to Billing**
   - In the left sidebar, click "Billing"
   - Click "Link a billing account" if not already set up
   - Follow the prompts to add your payment method

2. **Free Tier Information**
   - Google Cloud Text-to-Speech offers 1 million characters free per month
   - Perfect for vocabulary learning applications
   - Additional usage: $4.00 per 1 million characters

### Step 4: Create API Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"

2. **Configure API Key**
   - Copy the generated API key immediately
   - Click "Restrict Key" (recommended for security)
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Text-to-Speech API"
   - Click "Save"

### Step 5: Test Your Setup

1. **Open Your Lithuanian Vocabulary App**
   - Navigate to the conjugation trainer: `http://localhost:8080/conjugation.html`
   - Click the "🔊 TTS Settings" button

2. **Configure Google Cloud TTS**
   - Select "Google Cloud" as provider
   - Paste your API key in the "Google API Key" field
   - Click "Save API Key"

3. **Test the Connection**
   - Enter test text: "Labas rytas! Kaip sekasi?"
   - Click "Test Lithuanian TTS"
   - You should hear the Lithuanian pronunciation

## 🎯 Lithuanian Voice Configuration

Google Cloud supports Lithuanian with these voices:

- **Voice Name**: `lt-LT-Standard-A` (Female)
- **Language Code**: `lt-LT`
- **SSML Gender**: `FEMALE`

The application is pre-configured to use the best Lithuanian voice available.

## 🔧 Troubleshooting

### Common Issues:

1. **"API Key not valid" error**
   - Ensure the API key is copied correctly
   - Check that Text-to-Speech API is enabled
   - Verify API key restrictions allow Text-to-Speech API

2. **"Billing account required" error**
   - Set up billing in Google Cloud Console
   - Even free tier requires billing account setup

3. **"Quota exceeded" error**
   - Check usage in Google Cloud Console
   - Free tier: 1M characters/month
   - Consider upgrading if needed

4. **No audio output**
   - Check browser audio permissions
   - Ensure speakers/headphones are connected
   - Try the "Test English TTS" button first

### Debug Steps:

1. **Check Browser Console**
   - Press F12 → Console tab
   - Look for error messages

2. **Verify API Key**
   - Test with Google's API Explorer: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize

3. **Check Network Connection**
   - Ensure internet connection is stable
   - Check if firewall blocks Google Cloud APIs

## 💰 Cost Management

### Free Tier Limits:
- **1,000,000 characters per month** - FREE
- Resets monthly
- Perfect for personal vocabulary learning

### Paid Usage:
- **Standard voices**: $4.00 per 1M characters
- **WaveNet voices**: $16.00 per 1M characters
- **Neural2 voices**: $16.00 per 1M characters

### Cost Estimation for Vocabulary Learning:
- Average word: 8 characters
- 1000 words practice = 8,000 characters
- Free tier covers ~125,000 words per month
- More than enough for intensive language learning!

## 🔐 Security Best Practices

1. **Restrict Your API Key**
   - Always restrict to Text-to-Speech API only
   - Consider HTTP referrer restrictions for web apps
   - Never share your API key publicly

2. **Monitor Usage**
   - Check Google Cloud Console regularly
   - Set up billing alerts
   - Monitor for unexpected usage spikes

3. **Key Rotation**
   - Rotate API keys periodically
   - Delete unused API keys
   - Use separate keys for development/production

## 📞 Support Resources

- **Google Cloud Support**: https://cloud.google.com/support
- **Text-to-Speech Documentation**: https://cloud.google.com/text-to-speech/docs
- **API Reference**: https://cloud.google.com/text-to-speech/docs/reference/rest
- **Pricing Calculator**: https://cloud.google.com/products/calculator

## ✅ Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Text-to-Speech API
- [ ] Set up billing account
- [ ] Created and restricted API key
- [ ] Configured API key in vocabulary app
- [ ] Tested Lithuanian pronunciation
- [ ] Set up usage monitoring (optional)

---

**Need Help?** If you encounter issues, check the browser console (F12) for error messages and refer to the troubleshooting section above.