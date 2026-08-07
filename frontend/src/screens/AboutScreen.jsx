// screens/AboutScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { combineSchemas, getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../utils/structuredData';
import './AboutScreen.css';

const AboutScreen = () => {
  const navigate = useNavigate();
  // Rich structured data for SEO
  const structuredData = combineSchemas(
    getArticleSchema({
      title: "About Moral Torture Machine - Interactive Ethical Dilemma Game",
      description: "Learn how Moral Torture Machine uses deterministic game scoring and optional AI-written commentary for interactive ethical dilemmas.",
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
        title="About - Interactive Moral Dilemma Game"
        description="Discover Moral Torture Machine, an interactive ethical-dilemma game with deterministic scoring and optional AI-written commentary for reflection and discussion."
        keywords="moral philosophy, ethical dilemmas, trolley problem, philosophy game, ethical decision making, moral reasoning, interactive dilemmas"
        url="/about"
        structuredData={structuredData}
      />

      <div className="about-content">
        <h1 className="screen-title">About Moral Torture Machine</h1>

        <section className="about-section">
          <h2>What is the Moral Torture Machine?</h2>
          <p>
            The <strong>Moral Torture Machine</strong> is an interactive moral-dilemma game. Inspired by
            philosophical thought experiments like the famous <strong>trolley problem</strong>, it invites you
            to make difficult fictional choices, compare perspectives, and start conversations about ethics.
          </p>
          <p>
            Whether you study <strong>moral philosophy</strong> or simply want thought-provoking entertainment,
            the Moral Torture Machine combines ethical thought experiments with a game-like result and optional
            AI-written commentary. It is not a psychological assessment or professional advice.
          </p>
        </section>

        <section className="about-section">
          <h2>How Does It Work?</h2>
          <p>
            Our platform presents you with a series of carefully crafted <strong>ethical dilemmas</strong>
            that explore different ethical perspectives:
          </p>
          <ul>
            <li><strong>Utilitarian scenarios</strong> - Testing whether you prioritize the greatest good for the greatest number</li>
            <li><strong>Deontological dilemmas</strong> - Examining your commitment to moral rules and duties</li>
            <li><strong>Virtue ethics questions</strong> - Exploring your character-based moral judgments</li>
            <li><strong>Real-world applications</strong> - Modern ethical challenges in technology, medicine, and society</li>
          </ul>
          <p>
            After you complete the dilemmas, a <strong>deterministic, versioned game-scoring model</strong>
            groups the choices into six value dimensions and an archetype. Optional AI-generated copy only
            presents that result in a more conversational way; it does not determine scores, diagnose you, or
            measure your real-world character.
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
          </div>
        </section>

        <section className="about-section">
          <h2>Why Play With Moral Dilemmas?</h2>
          <p>
            Moral dilemmas can be a playful starting point for:
          </p>
          <ul>
            <li>
              <strong>Reflection</strong> - Notice how you approach a fictional difficult choice
            </li>
            <li>
              <strong>Philosophical education</strong> - Learn about major ethical theories
              through interactive experience
            </li>
            <li>
              <strong>Discussion</strong> - Compare different perspectives without treating either as a verdict
            </li>
            <li>
              <strong>Social discussions</strong> - Use the results as a starting point for
              meaningful conversations about ethics and morality
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>How the Game Is Scored</h2>
          <p>
            The game uses a versioned deterministic score across six value dimensions. Ethical traditions may
            inspire a scenario, but the result is a game construct rather than a scientific, psychological, or
            clinical model. The optional AI text is presentation only.
          </p>
          <ul>
            <li><strong>Empathy</strong> and <strong>integrity</strong></li>
            <li><strong>Responsibility</strong> and <strong>justice</strong></li>
            <li><strong>Altruism</strong> and <strong>honesty</strong></li>
          </ul>
          <p>
            It produces a repeatable in-game archetype from those values. It should not be used to make
            consequential judgments about yourself or anyone else.
          </p>
        </section>

        <section className="about-section">
          <h2>Free & Privacy-Focused</h2>
          <p>
            The Moral Torture Machine is <strong>completely free</strong> to use. We believe everyone
            should have access to tools for philosophical exploration and self-reflection. Your privacy is
            important to us: the service applies specific retention periods and gives signed-in users export
            and deletion controls. Read the <a href="/privacy">Privacy notice</a> for the exact data scope,
            retention, and sharing rules.
          </p>
        </section>

        <section className="about-section cta-section">
          <h2>Ready to Explore Your Moral Compass?</h2>
          <p>
            Start a short ethical-dilemma game, compare perspectives with friends if you choose, and use it as
            a prompt for discussion rather than a verdict about who anyone is.
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
