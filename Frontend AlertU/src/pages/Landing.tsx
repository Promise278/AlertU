import { Link, Navigate } from 'react-router-dom'

import logo from '../assets/alertu-header-logo-transparent.png'
import heroImage from '../assets/hero.png'
import { useAuth } from '../context/auth-context'

import './Landing.css'

const features = [
  {
    title: 'Live campus pulse',
    description:
      'See new reports and verified campus updates in one shared feed.',
  },
  {
    title: 'Map-based reporting',
    description:
      'Drop a location, add details, and help campus authorities respond faster.',
  },
  {
    title: 'Verified updates',
    description:
      'Follow review progress so the community sees accurate, trusted information.',
  },
]

function Landing() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="landing-page landing-loading">
        <p>Loading AlertU...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="landing-page">

      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="AlertU home">
          <img src={logo} alt="AlertU" />
        </Link>

        <nav className="landing-nav-actions" aria-label="Account">
          <Link to="/login" className="landing-sign-in">
            Sign in
          </Link>
          <Link to="/register" className="landing-nav-cta">
            Create account
          </Link>
        </nav>
      </header>

      <main>

        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-badge">
              Built for campus communities
            </span>

            <h1>
              Campus safety,
              <br />
              in real time.
            </h1>

            <p>
              Report incidents, follow verified updates, and keep
              your campus community informed when it matters most.
            </p>

            <div className="landing-actions">
              <Link to="/register" className="landing-primary">
                Create your account
              </Link>
              <Link to="/login" className="landing-secondary">
                Sign in
              </Link>
            </div>

            <ul className="landing-points">
              <li>Live incident feed</li>
              <li>Map-based reports</li>
              <li>Verified campus alerts</li>
            </ul>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-visual-frame">
              <img
                src={heroImage}
                alt="AlertU campus safety overview"
              />
            </div>

            <div className="landing-floating-card landing-floating-alert">
              <span className="landing-floating-dot"></span>
              <div>
                <strong>Verified update</strong>
                <p>Incident near Main Library</p>
              </div>
            </div>

            <div className="landing-floating-card landing-floating-report">
              <span className="landing-floating-mark">+</span>
              <div>
                <strong>New report</strong>
                <p>North Gate · just now</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features">
          {features.map((feature, index) => (
            <article className="landing-feature" key={feature.title}>
              <span className="landing-feature-number">
                0{index + 1}
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="landing-callout">
          <div>
            <p className="landing-eyebrow">YOUR CAMPUS, CONNECTED</p>
            <h2>Ready to make campus safer?</h2>
            <p>
              Join AlertU to report what you see and stay aware of
              what is happening around you.
            </p>
          </div>

          <div className="landing-callout-actions">
            <Link to="/register" className="landing-primary">
              Get started
            </Link>
            <Link to="/login" className="landing-callout-link">
              I already have an account
            </Link>
          </div>
        </section>

      </main>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <img src={logo} alt="AlertU" />
          <span>Campus safety, connected.</span>
        </div>

        <div className="landing-footer-links">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </footer>

    </div>
  )
}

export default Landing
