# Inpainting

Inpainting allows you to selectively edit parts of an image while keeping the rest unchanged. This powerful feature is perfect for making targeted modifications to specific areas of your images.

## Getting Started

1. **Upload Source Image**
   - Open the Source Image panel
   - Upload or drag & drop your image

2. **Enable Inpainting**
   - Toggle "Enable Inpainting" switch
   - Canvas will appear over your image

3. **Create Mask**
   - Draw on areas you want to change
   - Use brush tools to refine selection
   - Adjust brush size as needed

4. **Set Prompt**
   - Enter prompt describing desired changes
   - Optional: Add inpainting prefix prompt
   - Focus on describing the masked area

5. **Generate**
   - Click Generate to create the edit
   - Results appear in the gallery

## Masking Tools

### Brush Controls
- **Size**: Adjust with slider
- **Hardness**: Edge softness control
- **Opacity**: Mask strength

### Actions
- **Undo**: Revert last brush stroke
- **Clear**: Remove entire mask
- **Invert**: Switch masked/unmasked areas

## Writing Effective Prompts

### Structure
```
[What to remove/change], [What to add], [Style], [Details]
```

### Examples

**Remove Object:**
```
Remove the car, extend the grass and sidewalk naturally, match lighting and style
```

**Replace Object:**
```
Replace the chair with a vintage wooden rocking chair, maintain room lighting and style
```

**Add Element:**
```
Add blooming red roses to the garden, natural lighting, photorealistic style
```

## Best Practices

### Masking Tips
1. **Clean Edges**
   - Use appropriate brush size
   - Work slowly around edges
   - Zoom in for precision

2. **Coverage**
   - Mask slightly beyond target area
   - Include transition zones
   - Ensure complete coverage

3. **Multiple Passes**
   - Start with larger areas
   - Refine with smaller brushes
   - Use undo for mistakes

### Prompt Tips
1. **Be Specific**
   - Describe desired outcome clearly
   - Reference surrounding elements
   - Include style matching

2. **Context Awareness**
   - Consider lighting conditions
   - Match existing textures
   - Reference surrounding colors

3. **Quality Control**
   - Include quality descriptors
   - Specify detail level
   - Match original image style

## Advanced Techniques

### Seamless Integration
1. **Edge Blending**
   - Extend mask slightly beyond edge
   - Use softer brush around borders
   - Match lighting and texture

2. **Style Matching**
   - Reference original image style
   - Maintain consistent quality
   - Use similar detail level

### Complex Edits
1. **Multiple Passes**
   - Break complex edits into steps
   - Save intermediate results
   - Build up changes gradually

2. **Layered Masks**
   - Use multiple generations
   - Combine different edits
   - Build complexity gradually

## Quality Settings

### For Best Results
- Quality Steps: 30-40
- Guidance Scale: 7.0-8.0
- Prompt Strength: 0.8-1.0
- Use original dimensions

### For Quick Tests
- Quality Steps: 20
- Guidance Scale: 5.0
- Prompt Strength: 0.7
- Faster models

## Troubleshooting

### Common Issues

1. **Visible Seams**
   - Extend mask further
   - Use softer brush edges
   - Match lighting better in prompt

2. **Style Mismatch**
   - Be more specific about style
   - Reference original elements
   - Adjust guidance scale

3. **Poor Integration**
   - Check mask coverage
   - Improve prompt specificity
   - Try multiple generations

## Tips & Tricks

1. **Preparation**
   - Clean source image
   - Plan your changes
   - Test on small areas first

2. **Workflow**
   - Save versions frequently
   - Use image packs
   - Document successful settings

3. **Quality Control**
   - Check at full size
   - View at different scales
   - Compare with original

## Example Workflows

### Object Removal
1. Mask the object completely
2. Extend mask slightly beyond edges
3. Describe replacement content
4. Generate and refine

### Background Replacement
1. Mask background area
2. Keep subject edges clean
3. Describe new background
4. Match lighting and perspective

### Adding Elements
1. Mask insertion area
2. Describe new element
3. Match existing style
4. Blend edges carefully

## Related Features

- [Image to Image](image-to-image.md) for full image edits
- [Text to Image](text-to-image.md) for reference
- [Image Packs](image-packs.md) for saving workflows

{% hint style="tip" %}
Start with simple edits to learn the tool before attempting complex changes!
{% endhint %}
