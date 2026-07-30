import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiSparkles, 
  HiShieldCheck, 
  HiArrowRight,
  HiFolder,
  HiTag,
  HiSearch,
  HiPencilAlt,
  HiCloud,
  HiDocumentText,
  HiLightningBolt,
  HiRefresh,
  HiTranslate,
  HiCheckCircle,
  HiMenu,
  HiX
} from 'react-icons/hi';
import { FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import appLogo from '../assets/deepNote-app-logo.png';
import heroVideo from '../assets/hero video.mp4';
import ctaBg from '../assets/CTA section bg.jpg';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.15, // Trigger when 15% of element is visible
      rootMargin: '0px 0px -10% 0px' // Start animation slightly before element fully enters viewport
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Element entering viewport - add animate-in class
          entry.target.classList.add('animate-in');
          entry.target.classList.remove('animate-out');
        } else {
          // Element leaving viewport - add animate-out class
          entry.target.classList.remove('animate-in');
          entry.target.classList.add('animate-out');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all elements with scroll-animate class
    const animateElements = document.querySelectorAll('.scroll-animate');
    animateElements.forEach(el => {
      observer.observe(el);
    });

    // Cleanup
    return () => {
      animateElements.forEach(el => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <img src={appLogo} alt="DeepNote" className="nav-logo" />
            <span className="nav-title">DeepNote</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#editor">Editor</a>
            <a href="#organize">Organize</a>
            <a href="#ai">AI</a>
            <a href="#sync">Sync</a>
            <a href="#security">Security</a>
          </div>
          <div className="nav-actions">
            <button className="nav-btn-signin" onClick={() => navigate('/login')}>
              Sign in
            </button>
            <button className="nav-btn-primary" onClick={() => navigate('/signup')}>
              Get started
            </button>
          </div>
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <HiX /> : <HiMenu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-links">
            <a href="#features" onClick={() => handleNavClick('#features')}>Features</a>
            <a href="#editor" onClick={() => handleNavClick('#editor')}>Editor</a>
            <a href="#organize" onClick={() => handleNavClick('#organize')}>Organize</a>
            <a href="#ai" onClick={() => handleNavClick('#ai')}>AI</a>
            <a href="#sync" onClick={() => handleNavClick('#sync')}>Sync</a>
            <a href="#security" onClick={() => handleNavClick('#security')}>Security</a>
          </div>
          <div className="mobile-menu-actions">
            <button className="mobile-btn-signin" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
              Sign in
            </button>
            <button className="mobile-btn-primary" onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content-wrapper">
            <div className="hero-text-content">
              <h1 className="hero-title">
                Your <span className="highlight-green">thoughts</span>,
                <br />
                beautifully <span className="highlight-orange">organized</span>
              </h1>
              <p className="hero-description">
                Write, organize, and find your notes with AI-powered assistance. 
                Simple, elegant, and powerful.
              </p>
              <button className="hero-cta" onClick={() => navigate('/signup')}>
                Start writing free
                <HiArrowRight />
              </button>
            </div>
            <div className="hero-video-container">
              <video 
                className="hero-video" 
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src={heroVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="hero-video-overlay"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="content-section features-section">
          <div className="section-header scroll-animate">
            <h2 className="section-heading">Everything you need</h2>
            <p className="section-subheading">Powerful features designed for modern note-taking</p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-card scroll-animate slide-from-left">
              <div className="feature-icon-box" style={{background: 'linear-gradient(135deg, #1B4332 0%, #2D5F4C 100%)'}}>
                <HiPencilAlt />
              </div>
              <h3>Rich Text Editor</h3>
              <p>Block-based editing with formatting, lists, checklists, collapsible sections, and sketch support.</p>
            </div>
            <div className="feature-card glass-card scroll-animate slide-from-right">
              <div className="feature-icon-box" style={{background: 'linear-gradient(135deg, #2D5F4C 0%, #40916C 100%)'}}>
                <HiFolder />
              </div>
              <h3>Smart Folders</h3>
              <p>Organize notes in folders and subfolders. Create your perfect structure.</p>
            </div>
            <div className="feature-card glass-card scroll-animate slide-from-left">
              <div className="feature-icon-box" style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)'}}>
                <HiTag />
              </div>
              <h3>Tags & Labels</h3>
              <p>Tag notes for quick filtering. Find everything that matters instantly.</p>
            </div>
            <div className="feature-card glass-card scroll-animate slide-from-right">
              <div className="feature-icon-box" style={{background: 'linear-gradient(135deg, #1B4332 0%, #2D5F4C 100%)'}}>
                <HiSearch />
              </div>
              <h3>Powerful Search</h3>
              <p>Search by title, content, tags, or folders. Find any note in seconds.</p>
            </div>
          </div>
        </section>

        {/* Editor Section */}
        <section id="editor" className="content-section editor-section">
          <div className="section-split">
            <div className="section-content scroll-animate slide-from-left">
              <h2 className="section-heading">Write without limits</h2>
              <p className="section-text">
                Our block-based editor gives you complete control. Add text, lists, checklists, 
                collapsible sections, and even sketches. Format with markdown or use visual controls.
              </p>
              <ul className="feature-list">
                <li><span>✓</span> Multiple block types</li>
                <li><span>✓</span> Markdown support</li>
                <li><span>✓</span> Drag and drop blocks</li>
                <li><span>✓</span> Sketch and draw</li>
                <li><span>✓</span> Collapsible sections</li>
              </ul>
            </div>
            <div className="section-visual glass-card scroll-animate slide-from-right">
              <div className="editor-preview">
                <div className="preview-line"></div>
                <div className="preview-line short"></div>
                <div className="preview-line"></div>
                <div className="preview-line medium"></div>
                <div className="preview-line"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Organize Section */}
        <section id="organize" className="content-section organize-section">
          <div className="section-split reverse">
            <div className="section-visual glass-card scroll-animate slide-from-left">
              <div className="organize-preview">
                <div className="folder-item">
                  <HiFolder /> <span>Work Projects</span>
                </div>
                <div className="folder-item">
                  <HiFolder /> <span>Personal</span>
                </div>
                <div className="folder-item">
                  <HiFolder /> <span>Ideas</span>
                </div>
                <div className="tag-group">
                  <span className="tag-chip">urgent</span>
                  <span className="tag-chip">review</span>
                  <span className="tag-chip">draft</span>
                </div>
              </div>
            </div>
            <div className="section-content scroll-animate slide-from-right">
              <h2 className="section-heading">Organize your way</h2>
              <p className="section-text">
                Create folders, use tags, or combine both. Build a system that works for you. 
                Every note has its place, and you can find it instantly.
              </p>
              <ul className="feature-list">
                <li><span>✓</span> Nested folders</li>
                <li><span>✓</span> Multiple tags per note</li>
                <li><span>✓</span> Color-coded organization</li>
                <li><span>✓</span> Quick filters</li>
              </ul>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section id="ai" className="content-section ai-section">
          <div className="section-header centered scroll-animate">
           
            <h2 className="section-heading">Your intelligent writing assistant</h2>
            <p className="section-subheading">Let AI help you write better, faster, and smarter</p>
          </div>
          <div className="ai-bento-grid">
            <div className="ai-bento-card glass-card scroll-animate slide-from-left ai-card-tall">
              <div className="ai-card-icon">
                <HiDocumentText />
              </div>
              <h3>Summarize Notes</h3>
              <p>Get instant, intelligent summaries of your long notes and documents. Extract key points and main ideas automatically with AI-powered analysis.</p>
            </div>
            <div className="ai-bento-card glass-card scroll-animate slide-from-right">
              <div className="ai-card-icon">
                <HiLightningBolt />
              </div>
              <h3>Generate Title</h3>
              <p>Auto-generate meaningful, context-aware titles that capture the essence of your content.</p>
            </div>
            <div className="ai-bento-card glass-card scroll-animate slide-from-left">
              <div className="ai-card-icon">
                <HiPencilAlt />
              </div>
              <h3>Rewrite for Clarity</h3>
              <p>Improve readability and clarity with AI-powered rewriting that maintains your original intent.</p>
            </div>
            <div className="ai-bento-card glass-card scroll-animate slide-from-right ai-card-tall">
              <div className="ai-card-icon">
                <HiSearch />
              </div>
              <h3>Semantic Search</h3>
              <p>Find notes by meaning, not just keywords. Search using natural language and discover related content you didn't even know you had.</p>
            </div>
            <div className="ai-bento-card glass-card scroll-animate slide-from-left">
              <div className="ai-card-icon">
                <HiRefresh />
              </div>
              <h3>Smart Rephrase</h3>
              <p>Adjust tone instantly - professional, formal, friendly, academic, or casual. Perfect for any audience.</p>
            </div>
            <div className="ai-bento-card glass-card scroll-animate slide-from-right">
              <div className="ai-card-icon">
                <HiCheckCircle />
              </div>
              <h3>Fix Grammar</h3>
              <p>Catch spelling errors, grammar mistakes, and improve your writing quality automatically.</p>
            </div>
            <div className="ai-bento-card glass-card scroll-animate slide-from-left">
              <div className="ai-card-icon">
                <HiTranslate />
              </div>
              <h3>Expand Ideas</h3>
              <p>Turn brief notes into detailed paragraphs. AI helps you elaborate on concepts and add depth.</p>
            </div>
          </div>
        </section>

        {/* Sync Section */}
        <section id="sync" className="content-section sync-section">
          <div className="section-split">
            <div className="section-content scroll-animate slide-from-left">
              <h2 className="section-heading">Always in sync</h2>
              <p className="section-text">
                Write on your laptop, review on your phone, edit on your tablet. 
                Your notes sync instantly across all your devices.
              </p>
              <ul className="feature-list">
                <li><span>✓</span> Real-time synchronization</li>
                <li><span>✓</span> Offline access</li>
                <li><span>✓</span> Automatic backups</li>
                <li><span>✓</span> Version history</li>
              </ul>
            </div>
            <div className="section-visual glass-card scroll-animate slide-from-right">
              <div className="sync-preview">
                <HiCloud style={{fontSize: '4rem', color: 'var(--forest-green)', opacity: 0.6}} />
                <div className="sync-indicator"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="content-section security-section">
          <div className="section-header centered scroll-animate">
            <h2 className="section-heading">Private and secure</h2>
            <p className="section-subheading">Your notes are encrypted and protected. Always.</p>
          </div>
          <div className="security-features">
            <div className="security-item scroll-animate slide-from-left">
              <h4>End-to-end encryption</h4>
              <p>Your data is encrypted in transit and at rest</p>
            </div>
            <div className="security-item scroll-animate fade-in-up">
              <h4>Secure authentication</h4>
              <p>Firebase authentication with industry standards</p>
            </div>
            <div className="security-item scroll-animate slide-from-right">
              <h4>Privacy first</h4>
              <p>We never sell your data or share it with third parties</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta-section">
          <div className="final-cta-content scroll-animate fade-in-up" style={{backgroundImage: `url(${ctaBg})`}}>
            <h2>Ready to get started?</h2>
            <button className="cta-button-large" onClick={() => navigate('/signup')}>
              Create free account
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand-section">
            <div className="footer-brand">
              <img src={appLogo} alt="DeepNote" className="footer-logo" />
              <span>DeepNote</span>
            </div>
            <p className="footer-tagline">
              Thoughtfully designed for modern note-taking
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>
          <div className="footer-links-container">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#editor">Editor</a>
              <a href="#organize">Organization</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
              <a href="mailto:hello@deepnote.app">hello@deepnote.app</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-brand">
          <span className="footer-large-text">DeepNote</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
