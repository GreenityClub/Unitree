# Avatar System

This folder contains the predefined avatar system for UniTree. Users can choose from a curated selection of beautiful avatars instead of uploading custom images.

## How It Works

- **Predefined Avatars**: Users select from preset avatars organized by categories
- **Emoji-Based**: Each avatar uses an emoji for display with custom gradient backgrounds
- **No File Uploads**: Zero native dependencies, works everywhere
- **Categories**: Animals, Nature, Abstract, Characters

## Adding New Avatars

To add more avatar options:

### 1. Update `avatarConfig.js`

Add new avatar objects to the `PREDEFINED_AVATARS` array:

```javascript
{
  id: 'unique_id',                    // Unique identifier
  name: 'Display Name',               // Human-readable name
  category: AVATAR_CATEGORIES.ANIMALS, // Category (see available categories)
  colors: ['#COLOR1', '#COLOR2'],     // Gradient colors [start, end]
  emoji: '🦊',                        // Emoji to display
  description: 'Short description'    // Personality trait
}
```

### 2. Update Server Validation

Add the new avatar IDs to `UniTree/server/src/routes/user.js`:

```javascript
const VALID_AVATARS = [
  // ... existing avatars
  'your_new_avatar_id'
];
```

### 3. Categories

Available categories:
- `AVATAR_CATEGORIES.ANIMALS` - Animal-themed avatars
- `AVATAR_CATEGORIES.NATURE` - Nature-themed avatars  
- `AVATAR_CATEGORIES.ABSTRACT` - Geometric/abstract designs
- `AVATAR_CATEGORIES.CHARACTERS` - Character/profession avatars

### 4. Color Guidelines

- Use complementary colors for gradients
- Ensure good contrast for accessibility
- Consider the app's green theme (#50AF27, #98D56D)
- Test colors on both light and dark backgrounds

### 5. Emoji Guidelines

- Choose clear, universally supported emojis
- Avoid complex emojis that might not display well at small sizes
- Test on different platforms (iOS, Android, Web)
- Consider color variations across platforms

## Future Image Support

If you want to add custom image support later:

1. **Create Image Assets**: Add PNG/SVG files to this folder
2. **Update Config**: Add `imageSource` property to avatar objects
3. **Update Component**: Modify `AvatarPicker.js` to handle both emojis and images
4. **Bundle Optimization**: Use appropriate image sizes and formats

## Examples

### Adding a Cat Avatar

```javascript
// In avatarConfig.js
{
  id: 'cat',
  name: 'Cat',
  category: AVATAR_CATEGORIES.ANIMALS,
  colors: ['#FFA500', '#FFD700'],
  emoji: '🐱',
  description: 'Independent and curious'
}
```

### Adding a New Category

```javascript
// In avatarConfig.js
export const AVATAR_CATEGORIES = {
  ANIMALS: 'animals',
  NATURE: 'nature',
  ABSTRACT: 'abstract',
  CHARACTERS: 'characters',
  FANTASY: 'fantasy'  // New category
};

// Add avatars with the new category
{
  id: 'dragon',
  name: 'Dragon',
  category: AVATAR_CATEGORIES.FANTASY,
  colors: ['#8B0000', '#FF4500'],
  emoji: '🐉',
  description: 'Mythical and powerful'
}
```

## Testing

After adding new avatars:

1. Restart the development server
2. Test avatar selection in the profile screen
3. Verify gradients render correctly
4. Check server validation accepts new IDs
5. Test on different devices/platforms

## Benefits of This System

✅ **No Native Dependencies** - Works in any React Native environment  
✅ **Fast Loading** - No image downloads or caching needed  
✅ **Consistent Design** - Curated look and feel  
✅ **Easy Maintenance** - No file storage or cleanup needed  
✅ **Cross-Platform** - Emojis work everywhere  
✅ **Scalable** - Easy to add unlimited options  
✅ **Offline Support** - No network requests needed 