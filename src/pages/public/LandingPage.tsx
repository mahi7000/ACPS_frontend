import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Building,
  ShieldCheck,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Users,
  Star,
  Zap,
  Globe,
  Smartphone,
  BarChart3
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [permitNumber, setPermitNumber] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (permitNumber.trim()) {
      navigate(`/verify/${permitNumber.trim()}`);
    }
  };

  const stats = [
    { label: 'Permits Processed', value: '12,450+', icon: FileText },
    { label: 'Active Users', value: '8,200+', icon: Users },
    { label: 'Cities Covered', value: '45+', icon: MapPin },
    { label: 'Avg. Processing', value: '3 Days', icon: Clock },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Faster Processing',
      description: 'Apply online and get your permits approved in days instead of weeks with automated workflows and real-time tracking.',
      benefits: ['24/7 online submission', 'Automated document verification', 'Instant status updates']
    },
    {
      icon: ShieldCheck,
      title: 'Secure Document Vault',
      description: 'Your documents are securely stored with enterprise-grade encryption and verified in your personal digital vault.',
      benefits: ['End-to-end encryption', 'Blockchain verification', 'Permanent record keeping']
    },
    {
      icon: FileText,
      title: 'Transparent Review Process',
      description: 'Track your application status in real-time and communicate directly with review officers throughout the process.',
      benefits: ['Live status dashboard', 'Direct messaging system', 'Complete audit trail']
    },
    {
      icon: Building,
      title: 'Digital Site Inspections',
      description: 'Site inspections conducted digitally with GPS-tagged photos, timestamps, and full accountability.',
      benefits: ['GPS-verified locations', 'Photo documentation', 'Instant inspection reports']
    },
    {
      icon: Globe,
      title: 'Nationwide Coverage',
      description: 'Our platform serves all major cities and regions across Ethiopia with consistent standards and processing.',
      benefits: ['45+ cities covered', 'Uniform standards', 'Local office integration']
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Access your permits, track applications, and receive notifications on any device, anywhere in the field.',
      benefits: ['Responsive design', 'Push notifications', 'Offline document access']
    },
  ];

  const testimonials = [
    {
      name: 'Abebe Kebede',
      role: 'Construction Manager',
      company: 'Addis Builders PLC',
      content: 'ACPS has transformed how we handle permits. What used to take weeks now happens in days. The transparency is remarkable.',
      rating: 5,
    },
    {
      name: 'Sara Haile',
      role: 'Lead Architect',
      company: 'EthioDesign Studio',
      content: 'The real-time tracking and digital inspections give us complete confidence in the entire permitting process.',
      rating: 5,
    },
    {
      name: 'Daniel Tadesse',
      role: 'Property Developer',
      company: 'Tadesse Developments',
      content: 'Digital inspections alone have saved us countless hours and eliminated all the paperwork we used to deal with.',
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Hero Section */}
      <section className="bg-white pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-highlight/10 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-highlight" />
            <span className="text-xs font-medium text-primary">Ethiopia's Leading Digital Permit Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6 tracking-tight">
            Construction permits,{' '}
            <span className="text-highlight">simplified</span>
          </h1>

          <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Fast, transparent, and secure permit processing for Ethiopia's construction industry. From application to approval in record time.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-16">
            <Link
              to="/register"
              className="bg-primary text-white hover:bg-primary-light font-medium text-sm px-6 py-3 rounded-xl transition-colors duration-200 inline-flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="text-slate-500 hover:text-primary font-medium text-sm px-6 py-3 rounded-xl transition-colors duration-200 border border-slate-200 hover:border-primary"
            >
              Sign in
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Verify a permit number (e.g., CP-2026-000001)"
                className="w-full pl-5 pr-12 py-3.5 rounded-xl border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm"
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 p-2 text-slate-400 hover:text-primary transition-colors duration-200 rounded-lg hover:bg-slate-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-highlight" />
              Instantly verify the authenticity of any construction permit
            </p>
          </form>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-highlight/10 group-hover:text-highlight transition-colors duration-200 mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Why ACPS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              A complete digital solution designed for Ethiopia's growing construction industry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-highlight/10 transition-colors duration-200 mb-4">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-highlight transition-colors duration-200" />
                </div>
                <h3 className="text-base font-semibold text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-highlight shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Getting your construction permit has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Account', description: 'Register online and complete your business profile with your credentials and documentation.' },
              { step: '2', title: 'Submit Application', description: 'Upload your documents and submit your permit application digitally for review.' },
              { step: '3', title: 'Get Approved', description: 'Receive your approved permit with digital verification and start building within days.' },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-5 group-hover:bg-highlight/10 group-hover:text-highlight transition-colors duration-200">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-4">
              Trusted by industry leaders
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              See what construction professionals across Ethiopia say about ACPS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow duration-200">
                <div className="flex gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-highlight text-highlight" />
                  ))}
                </div>

                <p className="text-sm text-slate-600 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {testimonial.name[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                    <div className="text-xs text-slate-400">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Benefits</p>
            <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-4">
              Why make the switch
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Digital permits are faster, more secure, and completely transparent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-highlight/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-2">90% Faster Approvals</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Our automated workflows reduce permit approval times from weeks to just a few days on average.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-highlight/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-2">Zero Lost Documents</h3>
                <p className="text-sm text-slate-500 leading-relaxed">All your permits and documents are stored securely in the cloud with permanent backup and easy retrieval.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-highlight/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-2">Direct Communication</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Message review officers directly through the platform and get clarifications without office visits.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-highlight/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-2">Accessible Anywhere</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Access your permits from any device, anywhere in Ethiopia, even in the field with limited connectivity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-primary">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to streamline your permits?
          </h2>
          <p className="text-base text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
            Join over 8,200 construction professionals already using ACPS to process their permits faster and more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-highlight text-primary hover:bg-white font-medium text-sm px-6 py-3 rounded-xl transition-colors duration-200"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="text-white/70 hover:text-white font-medium text-sm px-6 py-3 rounded-xl transition-colors duration-200"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};