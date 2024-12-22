# Webpage Indexer

A Chrome extension that systematically crawls and indexes web pages, saving content and files into organized collections. Built for researchers and analysts who need to efficiently archive web content.

## Features

- Automatic domain crawling
- File type categorization
- Structured JSON exports
- Organized file downloads by type (PDFs, docs, spreadsheets, etc.)
- Single-page and bulk indexing options

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `webpage-indexer` directory

## Usage

1. Click the extension icon to open the popup interface
2. Choose between:
   - "Index this page" for single page indexing
   - "Index all pages" to crawl the entire domain
3. Indexed content will be saved to your downloads folder in the following structure:
   ```
   webpage_index/
   ├── run_YYYYMMDD_HHMMSS/
   │   ├── pdfs/
   │   ├── docs/
   │   ├── spreadsheets/
   │   └── other/
   ```

## Permissions

- `activeTab`: For accessing current page content
- `scripting`: For running content scripts
- `tabs`: For managing crawled pages
- `downloads`: For saving indexed content
- `storage`: For maintaining extension state
- `cookies`: For handling authentication

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE) - see the LICENSE file for details.
