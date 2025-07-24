# Modular Settings Popup System

This is a responsive, modular settings popup system that adapts to different screen sizes and allows easy addition of new settings sections.

## Features

- **Responsive Design**: Shows sidebar navigation for screens > 700px width, top bar navigation for smaller screens
- **Modular Content**: Easy to add/remove settings sections
- **Functional Components**: Built with functional programming patterns
- **TypeScript Support**: Full type safety with interfaces
- **Customizable**: Easy to style and extend

## Usage

### Basic Usage

```typescript
import { getSettingsPopupManager } from './components/popups/SettingsPopupManager';

// Get the settings manager (initialized in main.ts)
const settingsManager = getSettingsPopupManager();

// Show the popup
settingsManager.show();

// Hide the popup
settingsManager.hide();

// Toggle the popup
settingsManager.toggle();
```

### Custom Buttons and Sections

```typescript
import { SettingsButton, SettingsContentSection } from './components/popups/SettingsPopup';

// Define custom buttons
const customButtons: SettingsButton[] = [
  {
    id: 'custom',
    label: 'Custom Section',
    onClick: (id) => console.log(`Custom section clicked: ${id}`)
  }
];

// Define custom content sections
const customSections: SettingsContentSection[] = [
  {
    id: 'custom',
    title: 'Custom Settings',
    render: (container, dimensions) => {
      // Add your custom content here
      // container is a PIXI Container
      // dimensions contains layout information
    },
    resize: (container, dimensions) => {
      // Handle resize if needed
    }
  }
];

// Show popup with custom content
settingsManager.show(customButtons, customSections);
```

### Creating New Settings Sections

1. Create a new file in `src/components/popups/settings/`
2. Export a function that returns a `SettingsContentSection`
3. Import and use it in your popup

Example:

```typescript
// MyCustomSection.ts
import { Container, Text } from 'pixi.js';
import { SettingsContentSection, SettingsPopupDimensions } from '../SettingsPopup';

export const createMyCustomSection = (): SettingsContentSection => {
  return {
    id: 'mycustom',
    title: 'My Custom Settings',
    render: (container: Container, dimensions: SettingsPopupDimensions) => {
      // Add your UI elements here
      const label = new Text('Custom Content', {
        fontFamily: 'GameFont',
        fontSize: 18,
        fill: 0xFFFFFF
      });
      label.x = 20;
      label.y = 20;
      container.addChild(label);
    },
    resize: (container: Container, dimensions: SettingsPopupDimensions) => {
      // Handle resize if needed
    }
  };
};
```

## API Reference

### SettingsPopupManager

- `show(buttons?, sections?)` - Show the popup with optional custom content
- `hide()` - Hide the popup
- `toggle(buttons?, sections?)` - Toggle popup visibility
- `isPopupVisible()` - Check if popup is currently visible
- `handleResize()` - Handle screen resize (called automatically)
- `setActiveSection(sectionId)` - Set active section programmatically
- `getActiveSection()` - Get current active section ID
- `addSection(section)` - Add a section dynamically
- `removeSection(sectionId)` - Remove a section dynamically

### SettingsPopupDimensions

Contains layout information for responsive design:

```typescript
interface SettingsPopupDimensions {
  screenWidth: number;
  screenHeight: number;
  popupWidth: number;
  popupHeight: number;
  popupX: number;
  popupY: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  isWideScreen: boolean; // true if width > 700px
  navigationHeight: number;
  navigationY: number;
}
```

## Responsive Behavior

- **Wide screens (> 700px)**: Sidebar navigation on the left, content on the right
- **Narrow screens (≤ 700px)**: Top bar navigation, content below

## Built-in Sections

The system comes with three pre-built sections:

1. **Audio Settings** (`AudioSettingsSection.ts`)
   - Volume controls
   - Sound effects toggle
   - Background music toggle
   - Audio quality settings

2. **Game Settings** (`GameSettingsSection.ts`)
   - Auto-play settings
   - Animation speed
   - Game statistics
   - Data management

3. **Account Settings** (`AccountSettingsSection.ts`)
   - Account information
   - Profile management
   - Privacy settings
   - Notifications

## Styling

The popup uses the existing UI theme colors from `UI_THEME` in `constants/UIThemeColors.ts`. You can customize colors by modifying the theme or overriding specific colors in your sections.

## Integration

The settings popup is automatically integrated with:

- **TopBar**: Settings button opens the popup
- **Activity Manager**: Records settings interactions
- **Sound Manager**: Plays UI click sounds
- **Resize Handler**: Automatically handles screen resize events

## Adding to Existing Projects

1. Import the popup manager in your main initialization
2. Initialize it with your PIXI Application
3. Add the settings button click handler
4. Handle resize events

The system is designed to be drop-in compatible with existing PIXI.js applications.
