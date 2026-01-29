import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Calendar, Clock, Lock } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/signup');
        }
    };

    return (
        <div className="landing-container">

            {/* Header */}
            <header className="landing-header">
                <div style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #fff 0%, #999 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Timeline.
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-ghost"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary"
                        style={{ borderRadius: '2rem', padding: '0.5rem 1.5rem' }}
                    >
                        Get Started
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="landing-main">

                {/* Ambient Background Glow */}
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '600px', maxWidth: '100%', height: '600px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0
                }} />

                <h1 className="landing-hero-title">
                    Master Your Week with <span style={{ color: 'hsl(var(--accent))' }}>Precision.</span>
                </h1>

                <p className="landing-hero-text">
                    The ultimate visual weekly scheduler for professionals.
                    Plan down to the minute, analyze your time, and stay in control.
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
                    <button
                        onClick={handleGetStarted}
                        className="btn btn-primary"
                        style={{
                            fontSize: '1.125rem', padding: '1rem 2.5rem', borderRadius: '3rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)'
                        }}
                    >
                        Start Scheduling <ArrowRight size={20} />
                    </button>
                </div>

                {/* Feature Grid */}
                <div className="landing-grid">
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'left' }}>
                        <div style={{ color: 'hsl(var(--accent))', marginBottom: '1rem' }}><Clock size={32} /></div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Precision Timing</h3>
                        <p style={{ color: 'var(--fg-secondary)' }}>Schedule meetings with minute-level accuracy. No more rigid 30-minute blocks.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'left' }}>
                        <div style={{ color: '#ec4899', marginBottom: '1rem' }}><Calendar size={32} /></div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Visual Recurrence</h3>
                        <p style={{ color: 'var(--fg-secondary)' }}>Set up repeating weekly sessions in a single click. Visualize your routine instantly.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'left' }}>
                        <div style={{ color: '#3b82f6', marginBottom: '1rem' }}><Lock size={32} /></div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Private & Secure</h3>
                        <p style={{ color: 'var(--fg-secondary)' }}>Your schedule is yours alone. Protected by secure authentication and local encryption.</p>
                    </div>
                </div>

            </main>

            <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--fg-secondary)', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} Timeline Scheduler. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
