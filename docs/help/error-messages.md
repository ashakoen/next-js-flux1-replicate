# Error Messages Guide

This guide explains common error messages you might encounter in MagicBox AI and how to resolve them.

## API Related Errors

### "Please enter your Replicate API key"
- **Cause**: Missing or invalid API key
- **Solution**: 
  1. [Set up your API key](../getting-started/api-setup.md)
  2. Check if the key is entered correctly
  3. Verify the key is active on Replicate's dashboard

### "Failed to validate API key"
- **Cause**: Invalid or expired API key
- **Solution**: 
  1. Get a new API key from Replicate
  2. Enter the new key in Settings
  3. Check your Replicate account status

## Model Errors

### "Quality Steps must be 4 or less when using the FLUX.1 Schnell model"
- **Cause**: Attempting to use more than 4 quality steps with Schnell model
- **Solution**: 
  1. Reduce quality steps to 4 or less
  2. Or switch to FLUX.1 Dev/Pro for higher quality steps

### "Model is currently unavailable"
- **Cause**: Temporary model outage or maintenance
- **Solution**: 
  1. Wait a few minutes and try again
  2. Try a different model
  3. Check Replicate's status page

## Generation Errors

### "Generation failed"
- **Cause**: Various issues during image generation
- **Solution**: 
  1. Check the specific error message
  2. Verify your settings are compatible
  3. Try reducing complexity (quality steps, size)

### "Input validation failed"
- **Cause**: Invalid parameter combinations
- **Solution**: 
  1. Check parameter limits for your chosen model
  2. Adjust settings to valid ranges
  3. Reset to default settings if needed

## Storage Errors

### "Browser storage is full"
- **Cause**: Too many saved images in browser storage
- **Solution**: 
  1. Download important images
  2. Clear some images from gallery
  3. Use the Image Bucket for organization

### "Failed to save to bucket"
- **Cause**: Storage limit reached or browser issues
- **Solution**: 
  1. Clear space in your bucket
  2. Download and remove unused images
  3. Check browser storage permissions

## Network Errors

### "Failed to fetch"
- **Cause**: Network connectivity issues
- **Solution**: 
  1. Check your internet connection
  2. Refresh the page
  3. Try again in a few minutes

### "Request timed out"
- **Cause**: Slow connection or server response
- **Solution**: 
  1. Check your internet speed
  2. Try a smaller image size
  3. Reduce quality steps

## File Errors

### "Failed to process image pack"
- **Cause**: Invalid or corrupted image pack file
- **Solution**: 
  1. Verify the file format
  2. Check if the pack is complete
  3. Try re-exporting the pack

### "Unsupported file type"
- **Cause**: Attempting to upload an unsupported format
- **Solution**: 
  1. Check supported formats
  2. Convert file to supported format
  3. Use recommended file types

## Best Practices to Avoid Errors

1. **Start Simple**
   - Use default settings initially
   - Gradually adjust parameters
   - Test changes incrementally

2. **Monitor Resources**
   - Keep track of storage usage
   - Clear unused images regularly
   - Download important generations

3. **Check Settings**
   - Verify model compatibility
   - Review parameter limits
   - Use recommended ranges

4. **Stay Updated**
   - Check for browser updates
   - Review documentation regularly
   - Monitor for new features

## Getting Additional Help

If you encounter an error not listed here:
1. Check our [Common Issues](common-issues.md) guide
2. Review [Best Practices](best-practices.md)
3. Try resetting to default settings
4. Clear browser cache and reload

{% hint style="info" %}
Remember to note the exact error message and what you were doing when it occurred. This helps in troubleshooting and finding solutions.
{% endhint %}
