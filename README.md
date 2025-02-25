# Notate

Notate is a powerful, cross-platform chat application designed for seamless AI interactions. It combines enterprise-grade features with an intuitive interface, supporting a wide range of AI models and local deployment options.

## Key Features

- 🤖 **Multi-Model Support**: Integrate with leading AI providers including OpenAI, Anthropic, Google, XAI, OpenRouter, and DeepSeek
- 🏠 **Local Deployment**: Run models locally using llamacpp, transformers, or ollama inference
- 📚 **RAG Integration**: Built-in support for document Q&A through ChromaDB integration
- 🔧 **Flexible Configuration**: Custom API endpoints and comprehensive model settings
- 🎯 **Advanced Features**: Experimental reasoning capabilities and developer API access
- 🔒 **Privacy-Focused**: Local-only mode available for sensitive data handling

## Quick Start

Download the latest version of Notate for your platform:

- [Windows Installer](https://notate.hairetsu.com/download)
- [macOS Installer](https://notate.hairetsu.com/download)
- [Linux Deb](https://notate.hairetsu.com/download)

For detailed installation instructions, see our [Installation Guide](https://notate.hairetsu.com/docs/getting-started).

## Documentation

- [Getting Started](https://notate.hairetsu.com/docs/overview): A quick overview of Notate
- [Installation Guide](https://notate.hairetsu.com/docs/getting-started): Detailed setup instructions
- [Model Configuration](https://notate.hairetsu.com/docs/settings): Configure AI models and embeddings
- [File Collections](https://notate.hairetsu.com/docs/collections): How to use File Collections
- [File Collection Tools](https://notate.hairetsu.com/docs/collection-tools): Tools to ingest content from outside sources
- [API Reference](https://notate.hairetsu.com/docs/developer-integration): Technical documentation for developers
- [Troubleshooting](https://notate.hairetsu.com/docs/troubleshooting): Troubleshooting guide

Visit our complete documentation at [https://notate.hairetsu.com/docs](https://notate.hairetsu.com/docs)

## Community

Join our Discord community to get help, share feedback, and connect with other users and developers:
[Discord Server](https://discord.gg/vEFAwB8wFC)

## Support the Project

If you find this project helpful, consider supporting its development:

Donations are used to cover the costs of running the project, including server costs, domain registration, signed certificates, and other expenses.

[![PayPal](https://img.shields.io/badge/PayPal-donate-blue.svg)](https://www.paypal.com/donate/?hosted_button_id=W96TCRJ5Q3RJG)

## Screenshots

**Chat UI**
![Notate Chat Screenshot](https://www.hairetsu.com/notate-12.png)

**LLM Intergrations**
![Notate LLM Intergrations Screenshot](https://www.hairetsu.com/notate-10.png)

**Chat Settings**
![Notate Collections Screenshot](https://www.hairetsu.com/notate-06.png)

**Tool Settings**
![Notate Collections Screenshot](https://www.hairetsu.com/notate-11.png)  

**Ingestion from File or URL into ChromaDB**
![Notate Data Intake Screenshot](https://www.hairetsu.com/notate-3.png)

**Rag Chat Q/A**
![Notate Collections Screenshot](https://www.hairetsu.com/notate-08.png)

**Reasoning (Experimental)**
![Notate Collections Screenshot](https://www.hairetsu.com/notate-09.png)

**Dev API Key**
![Notate Dev Screenshot](https://www.hairetsu.com/notate-2.png)

### Local Only Mode Requirements

_Windows CUDA_

- Microsoft Visual Studio 2022 /w Desktop Development Tools C++ Build Tools
- CUDA 12.6 toolkit or later

_MacOS_

- Xcode 15.0 or later

- Python 3.12
- Node.js v16 or higher
- Package manager: npm or pnpm
- At least 2GB of free disk space (Recommended 10GB+ minimum for local models and FileCollections)
- Minimum 8GB RAM recommended
- CPU: 4 cores or more
- Nvidia RTX GPU recommended for local model inference 10GB VRAM or more preferably or Apple Silicon
- Operating System:
  - macOS 10.15 or later (Intel/Apple Silicon)
  - Windows 10/11
  - Linux

### External Requirements

- Python 3.12
- Node.js v16 or higher
- Package manager: npm or pnpm
- CPU: 4 cores or more
- MEMORY: 8GB RAM or more
- DISK: 2GB free space (Recommended 4GB minimum for FileCollections)
- OpenAI API key (optional)
  - Required for OpenAI embeddings and GPT models
  - Configure in settings after installation
- Anthropic API key (optional)
  - Required for Claude models
  - Configure in settings after installation
- Google API key (optional)
  - Required for Google models
  - Configure in settings after installation
- XAI API key (optional)
  - Required for XAI models
  - Configure in settings after installation

## Installation

1. Clone the repository: `git clone https://github.com/CNTRLAI/Notate.git`
2. Navigate to the electron project directory: `cd notate/Frontend`
3. Install dependencies: `npm install` or `pnpm install`
4. Build the frontend: `npm run build` or `pnpm run build`

## Running the Application in Development Mode

- Dev mode (macOS): `npm run dev:mac` or `pnpm run dev:mac`
- Dev mode (Windows): `npm run dev:win` or `pnpm run dev:win`
- Dev mode (Linux): `npm run dev:linux` or `pnpm run dev:linux`

## Compiling to .exe, .dmg, and .AppImage

- Production mode (macOS): `npm run dist:mac` or `pnpm run dist:mac`
- Production mode (Windows): `npm run dist:win` or `pnpm run dist:win`
- Production mode (Linux): `npm run dist:linux` or `pnpm run dist:linux`

## Location of the Application

(if Apple Silicon)

- macOS: `Notate/Frontend/dist/mac-arm64/Notate.app`
- macOS Installer: `Notate/Frontend/dist/Notate.dmg`

(if Intel)

- macOS: `Notate/Frontend/dist/mac/Notate.app`
- macOS Installer: `Notate/Frontend/dist/Notate.dmg`

(if Windows)

- Executable: `Notate/Frontend/dist/Notate.exe`
- Installer: `Notate/Frontend/dist/Notate.msi`

(if Linux)

- AppImage: `Notate/Frontend/dist/Notate.AppImage`
- Debian Package: `Notate/Frontend/dist/Notate.deb`
- RPM Package: `Notate/Frontend/dist/Notate.rpm`

## Thanks

Special thanks to our #1 beta tester Banks (@scallywag41) for their invaluable contributions and feedback during development.

## Coming Soon

- [ ] Chrome Extension For Ingesting Webpages/Files
- [ ] Additional Agent Tools
- [ ] Advanced Ingestion Settings
- [ ] Additional Document Types
- [ ] Output to Speech
