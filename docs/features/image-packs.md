# Image Packs

Image Packs are a powerful way to save, share, and reproduce your image generations. They capture everything needed to recreate an image, including settings, prompts, source images, and masks.

## Image Pack Drawer

The Image Pack Drawer provides a dedicated interface for managing your Image Packs. Located on the left sidebar, it gives you quick access to all your saved packs.

### Accessing the Drawer

- Look for the teal "Image Packs" button on the left sidebar
- Click to open the drawer interface
- The number of saved packs is indicated by a pulsing dot when packs are available

### Features

- **Pack Gallery**: Visual grid of all your saved Image Packs
- **Search**: Filter packs by prompt or model
- **Sorting**: Arrange by newest, oldest, or model type
- **Favorites**: Mark important packs with a star for easy access
- **Favorites Filter**: Toggle to show only favorite packs
- **Import**: Drag and drop zip files or click to browse

### Managing Image Packs

1. **Viewing Pack Details**
   - Hover over a pack to see a larger preview
   - Each card shows model type, prompt snippet, and creation date

2. **Using a Pack**
   - Click "Use" on any pack to load its settings
   - All parameters, including source images and masks, will be restored
   - Review settings before generating to make adjustments

3. **Favorites**
   - Click the star icon to mark a pack as favorite
   - Toggle the "Favorites Only" filter to focus on important packs
   - Favorites persist even when clearing regular packs

4. **Deleting Packs**
   - Remove individual packs with the "Delete" button
   - Use "Clear All Packs" to remove all non-favorite packs
   - Automatic cleanup of older, non-favorited packs

## What's in an Image Pack?

An Image Pack includes:
- Generated image
- Generation settings
- Prompt and parameters
- Source images (for img2img)
- Masks (for inpainting)
- Model information
- Metadata and timestamps

## Using Image Packs

### Creating Image Packs

1. **From Gallery**
   - Click the "⋮" menu on any image
   - Select "Download with Config" to save as a zip file
   - Or select "Save to Image Packs" to store directly in the drawer

2. **From Image Bucket**
   - Select images to include
   - Click "Download All"
   - Enable "Include Config Files"

### Downloading Image Packs

1. **From Gallery**
   - Click the "⋮" menu on any image
   - Select "Download with Config"
   - Choose save location

2. **From Image Bucket**
   - Select images to include
   - Click "Download All"
   - Enable "Include Config Files"

### Loading Image Packs

1. **Using the Image Pack Drawer**
   - Open the Image Pack drawer from the left sidebar
   - Browse, search, or filter your saved packs
   - Click "Use" on any pack to load settings
   - Click Generate to recreate the image

2. **Drag and Drop**
   - Drag .zip file onto the Image Pack drawer drop zone
   - Or drag onto the main interface
   - Review settings in preview
   - Click Generate to recreate

3. **Upload Button**
   - Click "Upload" in settings
   - Select .zip file
   - Confirm settings

## Pack Contents

### File Structure
```
generation-{timestamp}.zip/
├── generation.png        # Generated image
├── generation.json      # Configuration file
├── source.png          # Source image (if img2img)
└── mask.png           # Mask file (if inpainting)
```

### Configuration File
```json
{
  "prompt": "string",
  "model": "string",
  "seed": number,
  "guidance_scale": number,
  "num_inference_steps": number,
  "output_format": "string",
  "timestamp": "string",
  // ... other parameters
}
```

## Common Use Cases

### Workflow Sharing
- Save successful settings
- Share with team members
- Document processes
- Create templates

### Version Control
- Track generation history
- Compare different settings
- Save iterations
- Document changes

### Batch Processing
- Save settings for series
- Maintain consistency
- Process multiple images
- Automate workflows

## Best Practices

### Organization
1. **Naming Convention**
   - Use descriptive names
   - Include date/version
   - Note key parameters
   - Group related packs

2. **Documentation**
   - Add detailed prompts
   - Note special settings
   - Document modifications
   - Include purpose

3. **Storage**
   - Regular backups
   - Organize by project
   - Tag important packs
   - Archive completed work

## Advanced Usage

### Template Creation
1. **Base Settings**
   - Set up parameters
   - Test thoroughly
   - Document limitations
   - Note dependencies

2. **Variations**
   - Create style variants
   - Test different models
   - Save quality presets
   - Document use cases

### Batch Processing
1. **Preparation**
   - Organize source files
   - Create settings template
   - Test on samples
   - Document workflow

2. **Execution**
   - Process in batches
   - Monitor results
   - Adjust as needed
   - Save variations

## Tips & Tricks

### For Better Results

1. **Quality Control**
   - Test settings first
   - Verify all components
   - Check file integrity
   - Document issues

2. **Efficiency**
   - Use clear naming
   - Group similar packs
   - Create templates
   - Automate when possible

3. **Collaboration**
   - Share best practices
   - Document changes
   - Version control
   - Test shared packs

## Troubleshooting

### Common Issues

1. **Loading Errors**
   - Check file integrity
   - Verify all components
   - Check format compatibility
   - Review settings

2. **Missing Files**
   - Check pack contents
   - Verify source images
   - Check mask files
   - Review json config

3. **Settings Mismatch**
   - Check model compatibility
   - Verify parameter ranges
   - Review dependencies
   - Test settings

## Integration with Other Features

### Text to Image
- Save successful prompts
- Create style templates
- Document parameters
- Share techniques

### Image to Image
- Save source images
- Document transformations
- Track iterations
- Share workflows

### Inpainting
- Save mask data
- Document techniques
- Share complex edits
- Create tutorials

## Security & Privacy

### Best Practices
- Review pack contents
- Remove sensitive data
- Check source permissions
- Document usage rights

### Sharing Guidelines
- Respect copyrights
- Credit sources
- Note limitations
- Include licenses

{% hint style="info" %}
Image Packs are a great way to build a library of successful techniques and settings. Use them to maintain consistency and share knowledge!
{% endhint %}
