# Setting Up Your API Key

MagicBox AI uses Replicate's API to power its image generation capabilities. This guide will help you get and set up your API key.

## How MagicBox AI Uses Replicate

MagicBox AI acts as an interface to Replicate's services, using your personal API key to:
- Generate images through various AI models
- Process image-to-image transformations
- Handle inpainting operations
- Perform AI language model interactions

Important notes about data handling:
- All image generation and AI interactions are processed directly through the Replicate API
- MagicBox AI does not control or monitor any user-supplied content
- Your prompts, images, and other inputs are sent directly to Replicate
- Usage of the Replicate API is subject to Replicate's terms and conditions
- Review [Replicate's Terms of Service](https://replicate.com/terms) for detailed information

## Getting Your Replicate API Key

1. **Create a Replicate Account**
   - Go to [replicate.com](https://replicate.com)
   - Click "Sign Up" or "Log In"
   - You can sign up using GitHub or email

2. **Access Your API Key**
   - After logging in, click your profile picture
   - Select "API Tokens"
   - Click "Create API token"
   - Give your token a name (e.g., "MagicBox AI")
   - Copy the generated API key

{% hint style="warning" %}
Keep your API key secure! Don't share it with others or expose it in public repositories.
{% endhint %}

## Setting Up in MagicBox AI

1. **Open API Settings**
   - Look for the ⚙️ Settings icon in the Generation Settings panel
   - Click to open the API Settings dialog

2. **Enter Your API Key**
   - Paste your Replicate API key into the input field
   - Click Save
   - The dialog will close automatically

3. **Verify Setup**
   - The API key alert should disappear
   - Try generating an image to confirm everything works

## Storage & Security

- Your API key is stored securely in your browser's local storage
- It's only sent directly to Replicate's API
- The key is never sent to or stored on our servers
- You can remove it anytime by clearing your browser data

## Troubleshooting

If you see "Please enter your Replicate API key":
1. Check if you entered the key correctly
2. Try re-entering the key
3. Ensure you're using a valid, active API key
4. Clear your browser cache and try again

## API Usage & Billing

- Replicate charges based on usage
- Monitor your usage on [Replicate's dashboard](https://replicate.com/account/usage)
- Set up billing alerts to avoid unexpected charges
- Check [Replicate's pricing](https://replicate.com/pricing) for current rates

## Next Steps

Once your API key is set up:
- Follow our [Quick Start Guide](quick-start.md)
- Learn about [Model Selection](../interface/model-selection.md)
- Explore [Advanced Settings](../advanced/models.md)

{% hint style="info" %}
Remember to check Replicate's terms of service and usage policies to ensure compliance with their requirements.
{% endhint %}
