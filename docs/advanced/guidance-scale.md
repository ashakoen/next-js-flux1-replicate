# Guidance Scale Guide

The Guidance Scale (also known as CFG Scale) controls how closely the AI follows your prompt. This parameter balances creativity versus precision in image generation.

## Understanding Guidance Scale

### What Is Guidance Scale?

Guidance Scale determines the balance between:
- Following your prompt exactly (higher values)
- Creative interpretation (lower values)
- Range: 1.0 to 20.0
- Default: 7.0

### How It Works

1. **Low Values (1-5)**
   - More creative freedom
   - Looser interpretation
   - Unexpected results
   - Artistic variation

2. **Medium Values (6-10)**
   - Balanced approach
   - Good prompt adherence
   - Reasonable creativity
   - Reliable results

3. **High Values (11-20)**
   - Strict prompt following
   - Less creativity
   - More literal
   - Can be rigid

## Model-Specific Ranges

### FLUX.1 Dev
- Minimum: 3.0
- Recommended: 7.0-8.0
- Maximum: 15.0
- Sweet spot: 7.0

### FLUX.1 Schnell
- Minimum: 3.0
- Recommended: 5.0-6.0
- Maximum: 10.0
- Sweet spot: 5.0

### FLUX.1 Pro
- Minimum: 5.0
- Recommended: 8.0-12.0
- Maximum: 20.0
- Sweet spot: 10.0

### ReCraft v3
- Minimum: 3.0
- Recommended: 6.0-8.0
- Maximum: 15.0
- Sweet spot: 7.0

## Use Case Examples

### Creative Art
```
Scale: 3.0-5.0
Purpose: Artistic freedom
Best for: Abstract, experimental
Models: Dev, ReCraft v3
```

### Portrait Work
```
Scale: 7.0-9.0
Purpose: Accurate features
Best for: Faces, people
Models: Dev, Pro
```

### Technical Images
```
Scale: 10.0-15.0
Purpose: Precise details
Best for: Product shots
Models: Pro
```

## Optimal Settings

### For Creativity
- Scale: 3.0-5.0
- Higher quality steps
- Detailed prompts
- Multiple generations

### For Accuracy
- Scale: 8.0-12.0
- Higher quality steps
- Precise prompts
- Fewer variations

### For Balance
- Scale: 6.0-8.0
- Standard steps
- Clear prompts
- Normal workflow

## Advanced Techniques

### Fine-Tuning

1. **Start Middle**
   - Begin at 7.0
   - Test variations
   - Note differences
   - Find sweet spot

2. **Adjust for Content**
   - Faces: Higher
   - Abstract: Lower
   - Products: Higher
   - Artistic: Lower

3. **Combine with Steps**
   - Low Scale + High Steps
   - High Scale + High Steps
   - Balance for needs
   - Test combinations

## Common Issues

### Too Low Scale

**Symptoms**
- Ignores prompt details
- Random elements
- Inconsistent results
- Wrong interpretations

**Solutions**
1. Increase scale
2. Be more specific
3. Use better prompts
4. Check model

### Too High Scale

**Symptoms**
- Rigid results
- Artificial look
- Over-emphasis
- Loss of naturalness

**Solutions**
1. Decrease scale
2. Balance creativity
3. Improve prompts
4. Adjust quality steps

## Best Practices

### Workflow Integration

1. **Testing Phase**
   - Start at 7.0
   - Try variations
   - Document results
   - Note preferences

2. **Production Phase**
   - Use proven values
   - Maintain consistency
   - Adjust as needed
   - Track results

3. **Final Output**
   - Match to content
   - Balance quality
   - Consider purpose
   - Review results

### Content-Specific Settings

1. **Portraits**
   - Scale: 7.0-9.0
   - Focus on features
   - Balance likeness
   - Natural look

2. **Landscapes**
   - Scale: 6.0-8.0
   - Natural elements
   - Composition focus
   - Atmospheric effects

3. **Products**
   - Scale: 8.0-12.0
   - Accurate details
   - Clear features
   - Precise rendering

## Tips & Tricks

### For Better Results

1. **Balance with Steps**
   - Higher scale = More steps
   - Lower scale = Standard steps
   - Match to purpose
   - Test combinations

2. **Content Matching**
   - Match scale to subject
   - Consider style
   - Think about purpose
   - Test variations

3. **Workflow Optimization**
   - Document successes
   - Note failures
   - Build presets
   - Maintain consistency

## Experimental Approaches

### Creative Discovery
1. Start very low (3.0)
2. Generate multiple images
3. Note interesting variations
4. Refine promising results

### Precision Tuning
1. Start high (12.0)
2. Adjust downward
3. Find balance point
4. Document settings

### Hybrid Method
1. Generate at different scales
2. Compare results
3. Combine best aspects
4. Refine approach

{% hint style="tip" %}
The perfect Guidance Scale often depends on your specific needs. Don't be afraid to experiment, but document what works for different types of images.
{% endhint %}
