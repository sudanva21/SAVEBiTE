// ==============================================
// SaveByte — App Constants (v2)
// ==============================================

import type { NavLink, NavSection, Feature, StatItem, LifecycleStage } from '@/types';

/** Site metadata */
export const SITE = {
  name: 'SAVEBiET',
  tagline: 'AI-Powered Food Lifecycle & Recovery Platform',
  description:
    'SAVEBiET applies AI intelligence across the entire food lifecycle — predicting demand, preventing surplus, matching food in real time, and recovering what cannot feed people.',
  url: 'https://savebiet.org',
  locale: 'en-US',
} as const;

/** Marketing navbar links — tactile pills inspired by reference */
export const MARKETING_NAV: NavLink[] = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Lifecycle', href: '/#lifecycle' },
  { label: 'Ecosystem', href: '/#ecosystem' },
  { label: 'Features', href: '/#features' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

/** Dashboard sidebar sections */
export const DASHBOARD_NAV: NavSection[] = [
  {
    title: 'Overview',
    links: [
      { label: 'Command Center', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Team & Access', href: '/team', icon: 'Users' },
      { label: 'Profile', href: '/profile', icon: 'User' },
    ],
  },
  {
    title: 'Food Intelligence',
    links: [
      { label: 'AI Intelligence', href: '/ai', icon: 'BrainCircuit' },
      { label: 'AI Operational Audit', href: '/ai-audit', icon: 'FileText' },
      { label: 'AI Copilot', href: '/copilot', icon: 'Bot' },
    ],
  },
  {
    title: 'Operations & Recovery',
    links: [
      { label: 'Food Catalog & Batches', href: '/inventory', icon: 'UtensilsCrossed' },
      { label: 'Surplus Management', href: '/surplus', icon: 'Radar' },
      { label: 'Matching Engine', href: '/matching', icon: 'GitMerge' },
      { label: 'Buy for Me', href: '/buy-for-me', icon: 'ShoppingBag' },
      { label: 'Sponsor a Meal', href: '/sponsor', icon: 'Heart' },
      { label: 'Recovery & Handover', href: '/recovery', icon: 'Recycle' },
    ],
  },
  {
    title: 'Logistics & IoT',
    links: [
      { label: 'Dispatch & Routes', href: '/routes', icon: 'Route' },
      { label: 'IoT Sensors', href: '/iot', icon: 'Cpu' },
    ],
  },
  {
    title: 'Intelligence & Simulation',
    links: [
      { label: 'Analytics & ESG', href: '/analytics', icon: 'BarChart3' },
      { label: 'Digital Twin', href: '/digital-twin', icon: 'Orbit' },
    ],
  },
  {
    title: 'Settings',
    links: [
      { label: 'Settings', href: '/settings', icon: 'Settings' },
    ],
  },
];

/** Food lifecycle pipeline */
export const FOOD_LIFECYCLE: LifecycleStage[] = [
  { key: 'predict',       label: 'Predict',       icon: 'BrainCircuit',   description: 'AI forecasts demand and identifies overproduction risk before prep starts.' },
  { key: 'prevent',       label: 'Prevent',       icon: 'ShieldCheck',    description: 'Data-driven production planning systematically reduces waste at the source.' },
  { key: 'produce',       label: 'Produce',       icon: 'Factory',        description: 'Commercial kitchens optimize batch sizes according to real-time footfall.' },
  { key: 'track',         label: 'Track',         icon: 'ScanLine',       description: 'IoT sensors monitor food quality, temperature, humidity, and expiry status.' },
  { key: 'detect',        label: 'Detect Surplus',icon: 'Radar',          description: 'Automated surplus detection triggers early redistribution workflows.' },
  { key: 'assess',        label: 'Assess Quality',icon: 'Microscope',     description: 'Multi-parameter freshness scoring verifies human consumption suitability.' },
  { key: 'match',         label: 'Match',         icon: 'GitMerge',       description: 'Algorithmic matching routes food to NGOs, community kitchens, or buyers.' },
  { key: 'redistribute',  label: 'Redistribute',  icon: 'Route',          description: 'Optimized cold-chain logistics deliver meals within freshness windows.' },
  { key: 'recover',       label: 'Recover',       icon: 'Recycle',        description: 'Unsuitable surplus transitions to authorized compost or biogas partners.' },
  { key: 'optimize',      label: 'Optimize',      icon: 'Cpu',            description: 'Dynamic fleet routing and temperature maintenance ensure zero spoilage.' },
  { key: 'measure',       label: 'Measure',       icon: 'BarChart3',      description: 'Audit CO₂ reduction, meals served, and verified ESG sustainability metrics.' },
  { key: 'improve',       label: 'Improve',       icon: 'TrendingUp',     description: 'Closed-loop AI insights continually refine future planning.' },
];

/** Landing page features — 15 SIH differentiators */
export const FEATURES: Feature[] = [
  { icon: 'BrainCircuit',  title: 'AI Demand Forecasting',                description: 'Predict consumption patterns with footfall, weather, and sales intelligence.' },
  { icon: 'Factory',       title: 'Smart Production Planning',            description: 'Actionable kitchen batch recommendations preventing overproduction.' },
  { icon: 'Radar',         title: 'Surplus Prediction & Detection',       description: 'Detect surplus early using shelf-life decay and inventory telemetry.' },
  { icon: 'Microscope',    title: 'Food Quality & Expiry Intelligence',   description: 'IoT freshness tracking and continuous cold-chain quality assurance.' },
  { icon: 'GitMerge',      title: 'AI Recipient & Request Matching',      description: 'Autonomous matching of surplus with shelters, NGOs, and community requests.' },
  { icon: 'ShoppingBag',   title: 'Buy for Me',                           description: 'Discounted surplus discovery for conscious secondary consumers.' },
  { icon: 'Heart',         title: 'Sponsor a Meal',                       description: 'Direct corporate CSR and individual micro-sponsorship of meal dispatches.' },
  { icon: 'MessageSquare', title: 'Food Requests Engine',                 description: 'NGOs post urgent demand; SAVEBiET matches nearby batches instantly.' },
  { icon: 'Recycle',       title: 'Industrial Food Recovery',             description: 'Certified upcycling pipelines for compost, biogas, and animal nutrition.' },
  { icon: 'Route',         title: 'Smart Logistics & Route Optimization', description: 'AI fleet routing minimizing transit time and ensuring freshness.' },
  { icon: 'Cpu',           title: 'IoT Telemetry Sensors',                description: 'Real-time temperature and humidity tracking from kitchen to destination.' },
  { icon: 'Orbit',         title: 'SAVEBiET Digital Twin',                description: 'Virtual food operations center simulating demand shocks and fleet logistics.' },
  { icon: 'FlaskConical',  title: 'Processing Unit Intelligence',         description: 'AI optimization for food processors and value recovery facilities.' },
  { icon: 'Leaf',          title: 'Sustainability & ESG Analytics',       description: 'Automated CO₂ offset calculations and audit-ready ESG reporting.' },
  { icon: 'Bot',           title: 'AI Copilot',                           description: 'Conversational assistant for kitchen operational decisions and dispatch alerts.' },
];

/** Landing page stats */
export const IMPACT_STATS: StatItem[] = [
  { value: '4.2M+',   label: 'Meals Recovered', icon: 'UtensilsCrossed' },
  { value: '18,400+', label: 'Tonnes CO₂ Offset', icon: 'Leaf' },
  { value: '940+',    label: 'Partner Kitchens', icon: 'Building2' },
  { value: '98.4%',   label: 'Prediction Accuracy', icon: 'TrendingDown' },
];

/** Footer links */
export const FOOTER_LINKS = {
  product: [
    { label: 'Lifecycle Pipeline', href: '/#lifecycle' },
    { label: 'Core Ecosystem', href: '/#ecosystem' },
    { label: 'Command Center', href: '/dashboard' },
    { label: 'Digital Twin', href: '/#features' },
  ],
  ecosystem: [
    { label: 'Food Donors', href: '/#ecosystem' },
    { label: 'NGOs & Shelters', href: '/#ecosystem' },
    { label: 'Buy for Me', href: '/#features' },
    { label: 'Industrial Recovery', href: '/#features' },
  ],
  company: [
    { label: 'About SAVEBiET', href: '/about' },
    { label: 'Contact Support', href: '/contact' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'ESG Reporting', href: '/#features' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Security & Compliance', href: '#' },
  ],
};
