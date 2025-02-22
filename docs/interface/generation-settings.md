# Generation Settings

The Generation Settings panel is the control center of MagicBox AI, where you'll configure all aspects of your image generation.

## Location & Layout

The Generation Settings panel is located on the left side of the interface and contains several key sections:

- Model Selection
- Prompt Input
- Quality Controls
- Output Settings
- Generation Actions

## Key Settings

### Model Selection

Choose from several AI models:
- **FLUX.1 Dev**: Balanced quality and speed (recommended for most uses)
- **FLUX.1 Schnell**: Faster generation, limited to 4 quality steps
- **FLUX.1 Pro**: Higher quality, slower generation
- **FLUX.1 Pro Ultra**: Maximum quality, longest generation time
- **ReCraft v3**: Specialized for certain art styles

[Learn more about models](../advanced/models.md)

### Quality Controls

#### Quality Steps
- Range: 1-50 (except Schnell: 1-4)
- Higher values = more detail but longer generation time
- Recommended: 28-35 for most uses
- [Learn more about Quality Steps](../advanced/quality-steps.md)

#### Guidance Scale
- Range: 1-20
- Controls how closely the image follows your prompt
- Lower values = more creative freedom
- Higher values = stricter prompt adherence
- Recommended: 3.5-7.0
- [Learn more about Guidance Scale](../advanced/guidance-scale.md)

### Output Settings

#### Format
- PNG: Highest quality, larger file size
- JPEG: Smaller file size, slight quality loss
- WebP: Good balance of quality and size
- SVG: Vector format (ReCraft v3 only)

#### Size & Dimensions
- Standard sizes available as presets
- Custom sizes supported
- Aspect ratio controls for specific formats

## Advanced Features

### LoRA Models
- Use specialized models for specific styles
- Adjust LoRA influence with scale slider
- [Learn more about LoRA Models](../features/lora-models.md)

### Image Packs
- Save and share generation settings
- Include source images and masks
- Export complete generation recipes
- [Learn more about Image Packs](../features/image-packs.md)

## Tips & Best Practices

1. **Start Conservative**
   - Begin with default settings
   - Adjust one parameter at a time
   - Note what works for future reference

2. **Model Selection**
   - Use Dev for exploration
   - Switch to Pro for final versions
   - Use Schnell for rapid prototyping

3. **Quality vs Speed**
   - Lower quality steps for quick tests
   - Higher steps for final images
   - Balance based on your needs

4. **Save Your Settings**
   - Use Image Packs to save successful configurations
   - Share settings with others
   - Build a library of proven settings

## Troubleshooting

Common issues and solutions:

1. **Generation Too Slow**
   - Reduce quality steps
   - Switch to a faster model
   - Enable "Go Fast" mode

2. **Poor Results**
   - Increase guidance scale
   - Add more quality steps
   - Check your prompt structure

3. **Model-Specific Issues**
   - Check [model limitations](../advanced/models.md)
   - Verify settings compatibility
   - See [Common Issues](../help/common-issues.md)

## Related Guides

- [Model Selection](model-selection.md)
- [Quality Settings](quality-settings.md)
- [Output Settings](output-settings.md)
- [Best Practices](../help/best-practices.md)
