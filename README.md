
# Script Modifier 🎬

**Script Modifier** is a powerful, visual node-based editor designed to supercharge your storytelling and content creation workflow using Google Gemini AI. 

Whether you are a screenwriter, a YouTuber, or a creative writer, this tool allows you to chain together AI operations—from brainstorming ideas and generating characters to writing full scripts and analyzing YouTube analytics—all on an infinite canvas.

![License](https://img.shields.io/badge/License-GPLv3-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat&logo=googlebard&logoColor=white)

## ✨ Features

### 🧠 Visual Node Editor
- **Infinite Canvas:** Drag, drop, connect, and organize nodes freely.
- **Workflow Automation:** Chain nodes together (e.g., *Idea -> Script -> Analyzer -> Image Prompts*).
- **Group & Organize:** Group nodes together to keep complex workflows clean.

### 🤖 AI-Powered Tools (Google Gemini)
- **Scriptwriting:**
  - **Script Generator:** Create scene-by-scene scripts with formatting, dialogue, and narrator text.
  - **Script Analyzer:** Break down scripts into frames, visual contexts, and shot lists.
  - **Prompt Finalizer:** Convert script scenes into highly detailed Stable Diffusion/Midjourney prompts.
- **Character Design:**
  - **Character Generator:** Create detailed profiles (Appearance, Personality, Clothing).
  - **Character Card:** Store and manage consistent character visuals and data.
- **YouTube Content:**
  - **Title Generator:** Generate click-worthy titles, descriptions, and tags.
  - **Analytics Advisor:** Analyze channel stats and get AI-driven growth strategy advice.
- **Audio & Video:**
  - **Speech Synthesizer:** Convert text to speech (TTS) with different voices and intonations.
  - **Audio Transcriber:** Convert audio/video files to text.
- **General AI:**
  - **Chat:** Converse directly with Gemini for brainstorming.
  - **Translator:** Instant translation between languages.
  - **Image Generator:** Create visuals directly within the app.

### 🛠 Technical Highlights
- **Local-First:** Your API keys and project data are stored locally in your browser (IndexedDB/LocalStorage).
- **Import/Export:** Save your full project or individual groups/characters to JSON.
- **Multi-language Support:** English, Russian, Spanish, German, Uzbek.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (Free tier available).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Neytrino2134/Script-Modifier.git
   cd Script-Modifier
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Go to `http://localhost:5173` (or the port shown in your terminal).

### Configuration
When you launch the app for the first time, you will be prompted to enter your **Gemini API Key**.
*   This key is stored **locally** in your browser's Local Storage.
*   It is sent **only** to Google's API servers.

## 📦 Tech Stack

*   **Frontend Framework:** React 18
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **AI Integration:** Google GenAI SDK (`@google/genai`)
*   **Localization:** Custom i18n implementation

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the GNU General Public License v3.0 (GPLv3). See `LICENSE.md` for more information.

---

*This project is not affiliated with Google.*
