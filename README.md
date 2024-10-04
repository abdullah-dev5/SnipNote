# SnipNote Chrome Extension

SnipNote is a Chrome extension that allows users to save links and notes while browsing. It provides a simple interface for adding notes and links, downloading them as a text file, and clearing stored notes.

## Features

- Save links and notes
- Download saved notes as a `.txt` file
- Clear all stored notes
- User-friendly interface with styled components

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine
- A modern web browser (Google Chrome recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/snipnote.git
   cd snipnote
2. Install the dependencies:

pnpm install
Build the project:

3. pnpm build

### Load the Extension in Chrome

1. Open Chrome and go to chrome://extensions.
2. Enable "Developer mode" in the top right corner.
3. Click on "Load unpacked" and select the dist folder of your project.
4. The SnipNote extension should now appear in your extensions list.
### Usage
  Click on the SnipNote icon in the Chrome toolbar to open the popup.
  Enter a link and note in the provided input fields.
  Click "Save Note" to store the link and note.
  Click "Download Notes as TXT" to download all saved notes as a text file.
  Click "Clear All Notes" to remove all saved notes.


## Project Structure

snipnote/
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Popup.tsx
│   │   
│   ├── background.ts
│   ├── index.tsx
│   ├── popup.html
│   └── styles.css
├── tsconfig.json
└── README.md

## Contributing
Feel free to open issues and submit pull requests for improvements or bug fixes.

 ### License
This project is licensed under the MIT License. See the LICENSE file for more information.

## Acknowledgements
This extension is built using React, TypeScript, and Vite for a fast development experience.

Feel free to replace `https://github.com/yourusername/snipnote.git` with your actual repository URL and update any sections as needed!
