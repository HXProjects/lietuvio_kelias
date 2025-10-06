# Google Cloud Text-to-Speech Troubleshooting Guide

This guide helps resolve common issues when setting up and using Google Cloud Text-to-Speech with your Lithuanian Vocabulary Builder.

## 🔍 Common Issues & Solutions

### 1. API Key Issues

#### "Invalid API key format" Error
**Symptoms:** Red error message when entering API key
**Solutions:**
- Ensure API key starts with "AIza"
- API key should be exactly 39 characters long
- Check for extra spaces or characters when copying
- Copy the key directly from Google Cloud Console

#### "API key not valid" Error
**Symptoms:** Error when testing TTS, even with correct format
**Solutions:**
1. **Check API Restrictions:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Click on your API key
   - Ensure "Cloud Text-to-Speech API" is selected under restrictions

2. **Verify API is Enabled:**
   - Go to APIs & Services → Library
   - Search "Text-to-Speech API"
   - Should show "API Enabled" (not "Enable")

3. **Check Project Selection:**
   - Ensure you're working in the correct project
   - Project name should appear in the top bar of Google Cloud Console

### 2. Billing & Quota Issues

#### "This API call requires billing to be enabled" Error
**Symptoms:** Error when testing TTS, billing alert in console
**Solutions:**
1. **Set Up Billing:**
   - Go to Google Cloud Console → Billing
   - Click "Link a billing account"
   - Add valid payment method
   - Even free tier requires billing setup

2. **Verify Billing is Active:**
   - Check billing account status is "Active"
   - Ensure project is linked to billing account

#### "Quota exceeded" Error
**Symptoms:** TTS stops working after heavy usage
**Solutions:**
- **Check Usage:** Google Cloud Console → APIs & Services → Quotas
- **Free Tier Limit:** 1,000,000 characters per month
- **Reset Date:** Quota resets on the 1st of each month
- **Upgrade:** Consider paid plan if needed

### 3. Audio Playback Issues

#### No Sound Output
**Symptoms:** TTS appears to work but no audio heard
**Solutions:**
1. **Browser Audio Permissions:**
   - Check if browser has audio permissions
   - Look for speaker icon in browser address bar
   - Allow audio for the site

2. **System Audio:**
   - Check system volume is not muted
   - Test with other audio (e.g., YouTube)
   - Try different browser

3. **Audio Device:**
   - Ensure headphones/speakers are connected
   - Check audio device is set as default
   - Try system audio test

#### Poor Audio Quality
**Symptoms:** Distorted, unclear, or robotic sound
**Solutions:**
- Lithuanian voice is optimized for clarity
- Check internet connection stability
- Try different audio device/headphones
- Consider using headphones for better clarity

### 4. Network & Connectivity Issues

#### "Network error" or "Failed to fetch"
**Symptoms:** Intermittent errors, slow loading
**Solutions:**
1. **Internet Connection:**
   - Check stable internet connection
   - Test with other websites
   - Try refreshing the page

2. **Firewall/Proxy:**
   - Ensure Google Cloud APIs are not blocked
   - Check corporate firewall settings
   - Try different network if available

3. **CORS Issues:**
   - API should work from any domain with proper key
   - Clear browser cache and cookies
   - Try incognito/private browsing mode

### 5. Browser-Specific Issues

#### Works in One Browser but Not Another
**Solutions:**
- **Clear Cache:** Clear browser cache and cookies
- **Update Browser:** Ensure browser is up to date
- **Extensions:** Disable ad blockers or privacy extensions temporarily
- **JavaScript:** Ensure JavaScript is enabled

#### Mobile Browser Issues
**Solutions:**
- Use Chrome or Safari on mobile
- Check mobile data/WiFi connection
- Try desktop version if mobile fails

### 6. Development & Testing Issues

#### Console Errors
**Check Browser Console (F12 → Console):**

**Common Error Messages:**
```
Error 400: API key not valid
→ Check API key format and restrictions

Error 403: Billing required
→ Set up billing account

Error 429: Quota exceeded
→ Check usage limits

TypeError: Cannot read property...
→ JavaScript error, try refreshing page
```

#### Testing Steps
1. **Test with Simple Text:** "Hello world"
2. **Test Lithuanian:** "Labas rytas"
3. **Check Network Tab:** Look for failed requests
4. **Try Different Voice:** Switch to English TTS first

## 🛠️ Debug Checklist

Use this checklist to systematically troubleshoot issues:

### Initial Setup
- [ ] Google Cloud project created
- [ ] Text-to-Speech API enabled
- [ ] Billing account set up and active
- [ ] API key created and copied correctly
- [ ] API key restricted to Text-to-Speech API only

### Configuration
- [ ] API key pasted in settings (no extra spaces)
- [ ] API key shows "Valid format" in green
- [ ] Google Cloud provider selected
- [ ] Test text entered correctly

### Testing
- [ ] Internet connection stable
- [ ] Browser audio permissions granted
- [ ] System audio working (test with other sites)
- [ ] No browser extensions blocking requests
- [ ] JavaScript enabled and working

### Advanced Debugging
- [ ] Browser console clear of errors (F12)
- [ ] Network requests successful (F12 → Network)
- [ ] API key restrictions correct in Google Cloud
- [ ] Billing account active and linked

## 💡 Pro Tips

### Cost Optimization
- **Monitor Usage:** Check Google Cloud Console regularly
- **Set Alerts:** Configure billing alerts at 50% and 90% of budget
- **Cache Audio:** Enable caching in settings to reduce API calls
- **Short Phrases:** Practice with shorter texts to save quota

### Best Performance
- **Stable Internet:** Use reliable WiFi for best results
- **Headphones:** Better audio quality than speakers
- **Modern Browser:** Chrome, Firefox, Safari work best
- **Regular Updates:** Keep browser and app updated

### Security
- **Restrict API Key:** Always restrict to Text-to-Speech API only
- **Monitor Access:** Check API usage for unexpected spikes
- **Don't Share:** Never share API keys publicly
- **Rotate Keys:** Change API keys periodically

## 📞 Getting Help

### Self-Service Resources
1. **Google Cloud Documentation:** https://cloud.google.com/text-to-speech/docs
2. **API Reference:** https://cloud.google.com/text-to-speech/docs/reference/rest
3. **Pricing Calculator:** https://cloud.google.com/products/calculator
4. **Status Page:** https://status.cloud.google.com/

### Support Channels
- **Google Cloud Support:** Available with paid support plans
- **Community Forums:** Stack Overflow with "google-cloud-platform" tag
- **GitHub Issues:** For app-specific problems

### Quick Contact Info
- **Google Cloud Console:** https://console.cloud.google.com
- **Support Cases:** (Requires paid support plan)
- **Community Support:** Stack Overflow, Reddit r/googlecloud

---

## 🔧 Emergency Fixes

If nothing else works, try these quick fixes:

1. **Full Reset:**
   - Clear browser cache completely
   - Create new API key
   - Restart browser

2. **Alternative Testing:**
   - Try Google's API Explorer: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
   - Test with curl command from terminal

3. **Fallback Options:**
   - Use local browser TTS temporarily
   - Try different browser/device
   - Use simple text first, then Lithuanian

**Remember:** Most issues are related to billing setup, API restrictions, or browser permissions. Start with these basics before diving deeper into technical troubleshooting.