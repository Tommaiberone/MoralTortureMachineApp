// screens/AboutScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { combineSchemas, getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../utils/structuredData';
import './AboutScreen.css';

const AboutScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Rich structured data for SEO
  const structuredData = combineSchemas(
    getArticleSchema({
      title: "About Moral Torture Machine - AI-Powered Ethical Dilemmas Platform",
      description: "Learn how Moral Torture Machine uses AI to analyze your moral framework through interactive ethical dilemmas like the trolley problem.",
      datePublished: "2024-10-01",
      dateModified: new Date().toISOString().split('T')[0],
      url: "https://moraltorturemachine.com/about"
    }),
    getFAQSchema(),
    getBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" }
    ])
  );

  return (
    <div className="screen-container about-container">
      <SEO
        title="About - AI-Powered Moral Philosophy Platform"
        description="Discover how Moral Torture Machine analyzes your ethical decision-making through the trolley problem and other moral dilemmas. Free AI-powered moral compass test with detailed analysis."
        keywords="moral philosophy, ethical dilemmas, trolley problem, moral compass test, AI ethics analysis, philosophical test, moral framework analysis, ethical decision making, moral reasoning, philosophy game, ethics test online"
        url="/about"
        structuredData={structuredData}
      />

      <div className="about-content">
        <h1 className="screen-title">About Moral Torture Machine</h1>

        <section className="about-section">
          <h2>What is the Moral Torture Machine?</h2>
          <p>
            The <strong>Moral Torture Machine</strong> is an innovative, AI-powered platform designed to explore
            your moral framework through interactive ethical dilemmas. Inspired by classical philosophical
            thought experiments like the famous <strong>trolley problem</strong>, our application challenges
            you to make difficult moral decisions and provides deep insights into your ethical reasoning patterns.
          </p>
          <p>
            Whether you're a philosophy student studying <strong>moral philosophy</strong>, someone curious
            about their <strong>moral compass</strong>, or just looking for thought-provoking entertainment,
            the Moral Torture Machine offers a unique experience that combines <strong>ethical theory</strong>
            with cutting-edge AI analysis.
          </p>
        </section>

        <section className="about-section">
          <h2>How Does It Work?</h2>
          <p>
            Our platform presents you with a series of carefully crafted <strong>ethical dilemmas</strong>
            that test different aspects of your moral reasoning:
          </p>
          <ul>
            <li><strong>Utilitarian scenarios</strong> - Testing whether you prioritize the greatest good for the greatest number</li>
            <li><strong>Deontological dilemmas</strong> - Examining your commitment to moral rules and duties</li>
            <li><strong>Virtue ethics questions</strong> - Exploring your character-based moral judgments</li>
            <li><strong>Real-world applications</strong> - Modern ethical challenges in technology, medicine, and society</li>
          </ul>
          <p>
            After you complete the dilemmas, our <strong>AI-powered analysis engine</strong> evaluates your
            responses, identifying patterns in your <strong>ethical decision-making</strong> and providing
            a comprehensive breakdown of your moral framework. You'll discover whether you lean more towards
            consequentialist thinking, rule-based ethics, or other philosophical approaches.
          </p>
        </section>

        <section className="about-section">
          <h2>The Famous Trolley Problem</h2>
          <p>
            The <strong>trolley problem</strong> is one of the most famous thought experiments in
            <strong>moral philosophy</strong>. First introduced by philosopher Philippa Foot in 1967,
            it poses a difficult moral dilemma:
          </p>
          <blockquote className="trolley-quote">
            A runaway trolley is heading towards five people tied to the tracks. You can pull a lever
            to divert the trolley to another track, where it will kill only one person. Do you pull the lever?
          </blockquote>
          <p>
            This classic <strong>ethical dilemma</strong> and its variations form the foundation of our
            platform, along with many other thought-provoking scenarios designed to test your
            <strong>moral reasoning</strong> abilities.
          </p>
        </section>

        <section className="about-section">
          <h2>Game Modes</h2>
          <div className="game-modes">
            <div className="mode-card">
              <h3>Solo Evaluation</h3>
              <p>
                Take the complete <strong>moral compass test</strong> on your own. Answer a curated
                selection of ethical dilemmas and receive detailed AI analysis of your moral framework.
                Perfect for self-reflection and understanding your <strong>ethical decision-making</strong> patterns.
              </p>
            </div>
            <div className="mode-card">
              <h3>Pass-the-Phone Mode</h3>
              <p>
                Play with friends and family! In this multiplayer mode, everyone answers the same
                <strong>ethical dilemmas</strong>, and you can compare your moral frameworks.
                Great for sparking deep philosophical discussions about ethics and morality.
              </p>
            </div>
            <div className="mode-card">
              <h3>Story Mode</h3>
              <p>
                Experience a narrative-driven journey through <strong>moral philosophy</strong>.
                Your choices shape the story while revealing insights about your ethical principles
                and moral compass.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Why Explore Your Moral Framework?</h2>
          <p>
            Understanding your <strong>moral framework</strong> has numerous benefits:
          </p>
          <ul>
            <li>
              <strong>Self-awareness</strong> - Gain deeper insights into your values and
              decision-making processes
            </li>
            <li>
              <strong>Philosophical education</strong> - Learn about major ethical theories
              through interactive experience
            </li>
            <li>
              <strong>Better decision-making</strong> - Understand the principles that guide
              your choices in difficult situations
            </li>
            <li>
              <strong>Social discussions</strong> - Use the results as a starting point for
              meaningful conversations about ethics and morality
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>The Science Behind Our Analysis</h2>
          <p>
            Our <strong>AI-powered moral analysis</strong> is based on established frameworks in
            <strong>moral philosophy</strong> and psychology. We evaluate your responses against
            well-researched ethical theories including:
          </p>
          <ul>
            <li><strong>Utilitarianism</strong> (Jeremy Bentham, John Stuart Mill)</li>
            <li><strong>Deontological Ethics</strong> (Immanuel Kant)</li>
            <li><strong>Virtue Ethics</strong> (Aristotle)</li>
            <li><strong>Care Ethics</strong> (Carol Gilligan)</li>
            <li><strong>Social Contract Theory</strong> (Thomas Hobbes, John Rawls)</li>
          </ul>
          <p>
            The analysis identifies patterns in your reasoning, consistency in your moral judgments,
            and provides personalized insights into your <strong>ethical decision-making</strong> style.
          </p>
        </section>

        <section className="about-section">
          <h2>Free & Privacy-Focused</h2>
          <p>
            The Moral Torture Machine is <strong>completely free</strong> to use. We believe everyone
            should have access to tools for philosophical exploration and self-reflection. Your privacy
            is important to us - we don't store your individual responses permanently, and all analysis
            is done securely.
          </p>
        </section>

        <section className="about-section cta-section">
          <h2>Ready to Explore Your Moral Compass?</h2>
          <p>
            Join thousands of users who have discovered insights about their ethical frameworks
            through our <strong>interactive moral philosophy platform</strong>. Take the
            <strong>moral compass test</strong> today and see where you stand on the great
            questions of ethics and morality.
          </p>
          <button
            className="cta-button"
            onClick={() => navigate('/')}
          >
            Start Your Moral Journey
          </button>
        </section>
      </div>

      <footer className="about-footer">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </footer>
    </div>
  );
};

export default AboutScreen;
