# Image to Image Generation

Image-to-image generation lets you use an existing image as a starting point for new creations. This feature is perfect for modifying, enhancing, or reimagining existing images.

## Getting Started

1. **Open Source Image Panel**
   - Click the "Source Image" button in the left sidebar
   - Upload an image or drag and drop

2. **Adjust Settings**
   - Set Prompt Strength (0.1-1.0)
   - Enter your prompt
   - Choose model and quality settings

3. **Generate**
   - Click Generate to create variations
   - Results appear in the gallery

## Understanding Prompt Strength

Prompt Strength controls how much the AI follows your prompt vs. preserving the original image:

- **0.1-0.3**: Subtle changes, maintains original composition
- **0.4-0.6**: Balanced changes, recognizable but altered
- **0.7-0.9**: Major changes, loosely based on original
- **1.0**: Complete transformation, minimal original influence

## Best Practices

### Image Selection
- Use clear, high-quality source images
- Avoid images with text
- Simple compositions work best
- PNG or high-quality JPEG recommended

### Prompt Writing
- Describe desired changes clearly
- Reference elements to keep
- Specify style changes
- Include quality descriptors

## Common Use Cases

### Style Transfer
```
Source: Portrait photo
Prompt: "Oil painting in the style of Rembrandt, dramatic lighting, rich colors"
Strength: 0.7
```

### Background Change
```
Source: Object photo
Prompt: "Same object in a tropical beach setting, sunset lighting"
Strength: 0.5
```

### Detail Enhancement
```
Source: Landscape photo
Prompt: "Ultra detailed 4K resolution, enhanced textures, dramatic lighting"
Strength: 0.3
```

## Model-Specific Tips

### FLUX.1 Dev
- Best for general transformations
- Good balance of preservation and change
- Works well with style transfers

### FLUX.1 Pro
- Better detail preservation
- Higher quality outputs
- Good for subtle enhancements

### ReCraft v3
- Specialized artistic transformations
- Good for illustration styles
- Best with strong style prompts

## Advanced Techniques

### Preserving Details
1. Use lower prompt strength (0.2-0.4)
2. Include descriptive elements from original
3. Specify "preserve details" in prompt

### Changing Style
1. Use higher prompt strength (0.6-0.8)
2. Be explicit about new style
3. Reference artistic techniques

### Composition Changes
1. Use medium prompt strength (0.5)
2. Describe new composition clearly
3. Reference original elements to keep

## Quality Settings

### For Best Results
- Quality Steps: 30-40
- Guidance Scale: 7.0-8.0
- Output Format: PNG
- Use original image dimensions

### For Quick Tests
- Quality Steps: 20
- Guidance Scale: 5.0
- Lower prompt strength
- Faster models (Schnell)

## Troubleshooting

### Poor Results
- Check image quality
- Adjust prompt strength
- Be more specific in prompts
- Try different models

### Inconsistent Output
- Lower guidance scale
- Use more descriptive prompts
- Keep prompt strength consistent
- Try multiple generations

### Loss of Detail
- Lower prompt strength
- Increase quality steps
- Mention "preserve details" in prompt
- Use Pro model for better preservation

## Tips & Tricks

1. **Iterative Approach**
   - Start with low strength
   - Save good results
   - Use successful results as new source

2. **Prompt Structure**
   ```
   [Keep from original], [Change to], [Style], [Quality]
   ```
   Example:
   ```
   Keep the person's pose and expression, transform background into a magical forest, digital art style, highly detailed
   ```

3. **Batch Processing**
   - Use multiple outputs
   - Try different strengths
   - Save variations
   - Compare results

## Related Features

- [Inpainting](inpainting.md) for targeted edits
- [Text to Image](text-to-image.md) for base concepts
- [Image Packs](image-packs.md) for saving settings

## Best Practices Summary

1. **Start Conservative**
   - Use lower prompt strength
   - Increase gradually
   - Save intermediate results

2. **Quality Balance**
   - Higher steps for final versions
   - Quick tests for concepts
   - Match settings to purpose

3. **Organization**
   - Save successful combinations
   - Document effective settings
   - Use image packs for workflows

{% hint style="info" %}
Remember to respect image rights and permissions when using source images!
{% endhint %}
