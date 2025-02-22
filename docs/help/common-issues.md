# Common Issues

This guide addresses frequently encountered issues in MagicBox AI and provides solutions for each problem.

## Generation Issues

### Images Look Blurry or Low Quality

**Symptoms**
- Lack of detail
- Fuzzy edges
- Overall softness

**Solutions**
1. Increase quality steps (30-50)
2. Add quality keywords to prompt
3. Use Pro model for better detail
4. Check output format (use PNG)

### Inconsistent Results

**Symptoms**
- Varying quality
- Inconsistent style
- Random elements

**Solutions**
1. Use consistent seed values
2. Be more specific in prompts
3. Adjust guidance scale up
4. Document successful settings

### Generation Takes Too Long

**Symptoms**
- Slow processing
- Long wait times
- Browser lag

**Solutions**
1. Use Schnell model for drafts
2. Reduce quality steps
3. Lower resolution
4. Clear browser cache

## Interface Issues

### Browser Storage Full

**Symptoms**
- Can't save new images
- Error messages
- Gallery not loading

**Solutions**
1. Download important images
2. Clear old generations
3. Use Image Bucket
4. Clear browser cache

### Interface Lag

**Symptoms**
- Slow response
- Delayed updates
- Choppy scrolling

**Solutions**
1. Clear browser cache
2. Reduce gallery size
3. Close unused tabs
4. Refresh browser

### Settings Not Saving

**Symptoms**
- Lost preferences
- Reset parameters
- Missing API key

**Solutions**
1. Check browser storage
2. Allow local storage
3. Re-enter settings
4. Clear cache if needed

## Model-Specific Issues

### FLUX.1 Schnell Limitations

**Symptoms**
- Quality step errors
- Limited detail
- Fast but rough results

**Solutions**
1. Keep steps ≤ 4
2. Use for drafts only
3. Switch to Dev/Pro for final
4. Adjust expectations

### FLUX.1 Pro Performance

**Symptoms**
- Very slow generation
- High resource usage
- Browser strain

**Solutions**
1. Use for finals only
2. Reduce resolution
3. Clear other tasks
4. Be patient

### ReCraft v3 Compatibility

**Symptoms**
- Style mismatches
- SVG issues
- Limited flexibility

**Solutions**
1. Use appropriate prompts
2. Check format support
3. Understand limitations
4. Consider alternatives

## API Issues

### API Key Problems

**Symptoms**
- Authentication errors
- Key not recognized
- Generation fails

**Solutions**
1. [Check API setup](../getting-started/api-setup.md)
2. Verify key is valid
3. Re-enter key
4. Contact Replicate support

### Rate Limiting

**Symptoms**
- Too many requests
- Generation fails
- Timeout errors

**Solutions**
1. Space out requests
2. Check usage limits
3. Monitor API usage
4. Upgrade if needed

## File Management

### Download Issues

**Symptoms**
- Files won't save
- Corrupt downloads
- Missing files

**Solutions**
1. Check browser settings
2. Try different format
3. Use Image Packs
4. Clear download cache

### Image Pack Problems

**Symptoms**
- Won't load properly
- Missing components
- Import fails

**Solutions**
1. Check file integrity
2. Verify all components
3. Re-export pack
4. Check format support

## Feature-Specific Issues

### Image to Image

**Symptoms**
- Poor integration
- Loss of detail
- Inconsistent results

**Solutions**
1. Adjust prompt strength
2. Use quality source
3. Match styles
4. Be more specific

### Inpainting

**Symptoms**
- Visible seams
- Poor blending
- Mask issues

**Solutions**
1. Extend mask edges
2. Use softer brush
3. Match context better
4. Multiple passes

## Browser Compatibility

### Chrome Issues

**Symptoms**
- Performance problems
- Storage limits
- Display glitches

**Solutions**
1. Update browser
2. Clear cache/cookies
3. Check extensions
4. Enable hardware acceleration

### Firefox/Safari Issues

**Symptoms**
- Layout problems
- Feature limitations
- Performance issues

**Solutions**
1. Use recommended browser
2. Update browser
3. Check compatibility
4. Clear cache

## Prevention Tips

### Regular Maintenance

1. **Clear Regular**
   - Download important files
   - Clear old generations
   - Organize gallery
   - Update settings

2. **Document Settings**
   - Save successful configs
   - Note issues/solutions
   - Track changes
   - Keep backups

3. **Monitor Resources**
   - Check storage usage
   - Track API usage
   - Monitor performance
   - Update regularly

## When to Seek Help

### Contact Support When

1. **Persistent Issues**
   - Tried all solutions
   - Recurring problems
   - System errors
   - API problems

2. **Account Issues**
   - API key problems
   - Billing questions
   - Access issues
   - Security concerns

{% hint style="info" %}
Most issues can be resolved by following best practices and maintaining your workspace. Regular cleanup and organization prevent many common problems!
{% endhint %}
