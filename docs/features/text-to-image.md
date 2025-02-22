# Text to Image Generation

Text-to-image is the core feature of MagicBox AI, allowing you to create images from textual descriptions. This guide will help you get the best results from your prompts.

## Quick Start

1. Select a model (FLUX.1 Dev recommended for starting)
2. Enter your prompt
3. Click Generate
4. Your image appears in the gallery

## Writing Effective Prompts

### Basic Structure
```
[Subject], [Setting/Environment], [Style], [Additional Details]
```

Example:
```
A majestic red dragon perched on a mountain peak, fantasy digital art, dramatic lighting, detailed scales, smoke effects
```

### Key Elements

1. **Subject**
   - Be specific about what you want
   - Include important details
   - Describe pose or action

2. **Environment**
   - Describe the setting
   - Mention lighting conditions
   - Include atmosphere/mood

3. **Style**
   - Specify art style
   - Reference medium (digital, oil, etc.)
   - Mention specific techniques

4. **Details**
   - Add color preferences
   - Include texture descriptions
   - Mention specific features

## Advanced Techniques

### Quality Descriptors
Add these to enhance image quality:
- "highly detailed"
- "4K resolution"
- "masterpiece"
- "professional photography"
- "cinematic lighting"

### Style Keywords
Different styles you can request:
- "digital art"
- "photorealistic"
- "oil painting"
- "concept art"
- "anime style"
- "watercolor"

### Composition Keywords
Control image composition:
- "close-up"
- "wide shot"
- "portrait"
- "landscape orientation"
- "symmetrical"
- "rule of thirds"

## Model-Specific Tips

### FLUX.1 Dev
- Balanced for most prompts
- Good with detailed descriptions
- Works well with style mixing

### FLUX.1 Schnell
- Best for quick iterations
- Keep prompts simpler
- Limited to 4 quality steps

### FLUX.1 Pro
- Handles complex prompts better
- Great for detailed work
- Takes longer to generate

### ReCraft v3
- Specialized for certain art styles
- Good for illustrations
- Supports SVG output

## Optimizing Results

### Quality Settings
- Start with 28 quality steps
- Guidance scale around 7.0
- Adjust based on results

### Resolution
- Standard: 512x512
- Landscape: 768x512
- Portrait: 512x768
- Higher resolutions need more steps

### Output Format
- PNG for highest quality
- JPEG for smaller files
- WebP for web use
- SVG for vector (ReCraft v3)

## Common Issues & Solutions

### Inconsistent Results
- Make prompts more specific
- Use more descriptive terms
- Keep style consistent

### Poor Quality
- Increase quality steps
- Adjust guidance scale
- Check model compatibility

### Wrong Style
- Be more explicit about style
- Use reference keywords
- Try different models

## Best Practices

1. **Start Simple**
   - Begin with basic prompts
   - Add details gradually
   - Note what works

2. **Iterate**
   - Save successful prompts
   - Try variations
   - Use different models

3. **Organize**
   - Save favorite prompts
   - Use image packs
   - Document successful settings

## Examples

### Basic to Advanced Prompt
Basic:
```
A cat in a garden
```

Better:
```
A fluffy orange tabby cat sitting in a blooming garden
```

Advanced:
```
A majestic orange tabby cat sitting among blooming roses and lavender, soft afternoon sunlight, bokeh effect, professional photography, shallow depth of field, 4K resolution
```

## Related Guides

- [Prompt Engineering](../advanced/prompts.md)
- [Model Selection](../interface/model-selection.md)
- [Quality Settings](../interface/quality-settings.md)
- [Best Practices](../help/best-practices.md)

{% hint style="tip" %}
Save your favorite prompts using the ⭐ button for quick access later!
{% endhint %}
