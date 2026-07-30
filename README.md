# 📝 DeepNote

> Your intelligent note-taking companion powered by AI

DeepNote is a modern, feature-rich note-taking application that combines powerful AI capabilities with an intuitive user interface. Built with React and Firebase, it offers seamless synchronization, smart content generation, and a beautiful responsive design optimized for all devices.

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-orange.svg)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![DeepNote Banner](public/deepNote-app-logo.png)

---

## ✨ Features

### 🤖 AI-Powered Writing Assistant
- **Smart Rephrasing**: Transform your content with different tones (Professional, Formal, Friendly, Academic, Shorter)
- **Content Summarization**: Instantly condense lengthy notes into key points
- **Auto Title Generation**: Let AI create meaningful titles from your content
- **Grammar Correction**: Fix grammar and improve clarity with one click
- **Content Rewriting**: Enhance readability and structure automatically

### 📄 Rich Text Editing
- **Formatting Options**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3 support
- **Lists**: Bullet points, numbered lists, and interactive checklists
- **Collapsible Sections**: Organize content with expandable sections
- **Sketch Support**: Draw and annotate directly in your notes
- **Block-Based Editor**: Modular content blocks for flexible organization

### 🗂️ Smart Organization
- **Folders**: Create custom folders to categorize your notes
- **Tags**: Add multiple tags for easy filtering and discovery
- **Pin Notes**: Keep important notes at the top
- **Archive**: Hide completed notes without deleting them
- **Search**: Quickly find notes by title or content

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode**: Easy on the eyes with full dark theme support
- **Masonry Grid**: Pinterest-style card layout on mobile
- **Smooth Animations**: Polished transitions and interactions
- **Touch-Friendly**: Large buttons and gestures for mobile devices

### ☁️ Cloud Synchronization
- **Firebase Backend**: Real-time sync across all your devices
- **Google Authentication**: Secure sign-in with your Google account
- **Auto-Save**: Your work is saved automatically as you type
- **Multi-Device Support**: Access your notes anywhere, anytime

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Firebase account
- Google AI (Gemini) API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/deepnote.git
   cd deepnote/DeepNote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication
   - Create a Firestore database
   - Add your web app and copy the config

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 🏗️ Project Structure

```
DeepNote/
├── src/
│   ├── assets/              # Images, videos, and static files
│   ├── components/          # Reusable React components
│   │   ├── EmptyState.jsx
│   │   ├── FolderModal.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── NoteCard.jsx
│   │   ├── NoteCreationModal.jsx
│   │   ├── NoteModal.jsx
│   │   └── PrivateRoute.jsx
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/               # Main application pages
│   │   ├── Dashboard.jsx    # Main notes dashboard
│   │   ├── Landing.jsx      # Landing page
│   │   ├── Login.jsx        # Authentication page
│   │   ├── NoteEditor.jsx   # Rich text note editor
│   │   └── Signup.jsx       # User registration
│   ├── services/            # API and business logic
│   │   ├── aiService.js     # Google Gemini AI integration
│   │   └── notesService.js  # Firebase Firestore operations
│   ├── App.jsx              # Main app component
│   ├── firebase.js          # Firebase configuration
│   └── main.jsx             # Application entry point
├── public/                  # Public assets
├── .env                     # Environment variables (create this)
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite configuration
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Icons** - Icon library
- **date-fns** - Date formatting

### Backend & Services
- **Firebase Authentication** - Google OAuth
- **Firestore** - NoSQL cloud database
- **Google AI (Gemini)** - AI content generation

### Build Tools
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting

### Styling
- **CSS3** - Custom styling with CSS variables
- **Responsive Design** - Mobile-first approach

---

## 📱 Screenshots

### Desktop View
*Dashboard with grid layout and folders*

### Mobile View
*Responsive masonry grid on mobile devices*

### AI Assistant
*Smart rephrasing with multiple tone options*

### Note Editor
*Rich text editing with formatting toolbar*

---

## 🎯 Key Features Breakdown

### Dashboard
- **View Modes**: Toggle between list and grid view
- **Quick Actions**: Create notes, folders, and sketches
- **FAB Menu**: Mobile-friendly floating action button
- **Auto-hide Navbar**: Maximizes screen space on scroll

### Note Editor
- **Three-Column Layout**: Navigation, editor, and recent notes
- **Mobile Optimized**: Single-column layout with header actions
- **AI Modal**: Context-aware AI assistance
- **Live Preview**: Real-time content rendering

### AI Assistant
- Summarize long notes
- Generate meaningful titles
- Rewrite for clarity
- Smart rephrase with tone selection
- Fix grammar and spelling

---

## 🔒 Security

- Firebase Authentication with Google OAuth
- Firestore security rules for user data isolation
- Environment variables for sensitive keys
- HTTPS-only in production

---

## 🚧 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notes collection
    match /notes/{noteId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId;
    }
    
    // Folders collection
    match /folders/{folderId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 🌐 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Google AI](https://ai.google.dev/) - AI capabilities
- [Vite](https://vitejs.dev/) - Build tool
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library

---

## 🔮 Future Enhancements

- [ ] Offline mode with IndexedDB
- [ ] Collaborative editing
- [ ] Export to PDF/Markdown
- [ ] Voice-to-text notes
- [ ] Smart reminders
- [ ] Note templates
- [ ] Advanced search filters
- [ ] Two-factor authentication
- [ ] Custom themes
- [ ] API integrations

---

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

<div align="center">
  Made with ❤️ and ☕
  
  ⭐ Star this repo if you find it helpful!
</div>
