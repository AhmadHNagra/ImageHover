# Media Preview Extension

A Chrome extension that provides instant media previews when hovering over links. Supports images, videos, and Imgur albums with an intuitive interface and customizable settings.

## Features

- **Instant Preview**: Hover over media links to see a preview without leaving the current page
- **Multi-Format Support**:
  - Images (jpg, jpeg, png, gif, webp)
  - Videos (mp4, webm)
  - Reddit videos (v.redd.it)
  - Imgur links (single images and albums)
- **Album Navigation**:
  - Mouse wheel scrolling
  - Arrow key navigation
  - Touch swipe support for mobile
  - Visual counter for album progress
- **Preview Controls**:
  - Middle-click to freeze/unfreeze preview
  - Click outside to close frozen preview
- **Video Settings**:
  - Configurable autoplay
  - Configurable mute state
- **Customizable Interface**:
  - Adjustable cursor offset
  - Configurable preview delay
  - Automatic positioning to stay within viewport

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

The extension can be configured through the Chrome extensions menu. Available settings include:

- `autoplayVideos`: Enable/disable automatic video playback (default: true)
- `muteVideos`: Enable/disable video sound (default: true)
- `cursorOffset`: Distance between cursor and preview box in pixels (default: 10)
- `previewDelay`: Delay before showing preview in milliseconds (default: 0)

## Usage

1. Hover over any supported media link to see a preview
2. For albums:
   - Use mouse wheel to navigate between images
   - Use arrow keys (←→↑↓) to navigate
   - Swipe left/right on touch devices
3. Middle-click to freeze the preview in place
4. Click anywhere outside the preview to close it

## Technical Details

- Uses Chrome Storage Sync API for persistent settings
- Implements responsive positioning to handle viewport boundaries
- Supports high-quality video streaming with quality fallbacks
- Includes loading indicators and error handling
- Imgur API integration for album support

## License

[Add your chosen license here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 