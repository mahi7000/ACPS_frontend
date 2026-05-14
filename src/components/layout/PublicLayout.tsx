import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-4">
        <div className="container mx-auto px-4 max-w-5xl flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-primary">
            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span>ACPS</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link to="/verify" className="text-sm text-slate-500 hover:text-primary transition-colors duration-200 px-4 py-2 rounded-xl">
              Verify Permit
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors duration-200 px-4 py-2 rounded-xl border border-slate-200 hover:border-primary"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-primary text-white hover:bg-primary-light transition-colors duration-200 px-4 py-2 rounded-xl"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-primary mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-sm text-slate-500 hover:text-primary transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-sm text-slate-500 hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/verify" className="text-sm text-slate-500 hover:text-primary transition-colors">Permit Verification</Link></li>
                <li><Link to="/api" className="text-sm text-slate-500 hover:text-primary transition-colors">API Access</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-slate-500 hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="text-sm text-slate-500 hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="text-sm text-slate-500 hover:text-primary transition-colors">Careers</Link></li>
                <li><Link to="/press" className="text-sm text-slate-500 hover:text-primary transition-colors">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link to="/help" className="text-sm text-slate-500 hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="text-sm text-slate-500 hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="text-sm text-slate-500 hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="/status" className="text-sm text-slate-500 hover:text-primary transition-colors">System Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-sm text-slate-500 hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-slate-500 hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/compliance" className="text-sm text-slate-500 hover:text-primary transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">&copy; 2026 ACPS — Automated Construction Permit System. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-highlight" />
              <span>Addis Ababa, Ethiopia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};