// Lightweight index of landing page campaigns for the homepage's "Explore
// our resources" section — deliberately separate from the full content in
// content/landing-pages/*.json (which build scripts read directly) so this
// tiny manifest is all that ships in the client bundle. Keep in sync with
// content/landing-pages/ when adding a new campaign page.
export const CAMPAIGN_CATEGORIES = [
  {
    title: 'DoD & Military Training',
    pages: [
      { slug: 'dod-cyber-awareness-challenge', label: 'DoD Cyber Awareness Challenge' },
      { slug: 'opsec-training', label: 'OPSEC Training' },
      { slug: 'information-assurance-training', label: 'Information Assurance (IA) Training' },
      { slug: 'anti-terrorism-level-1-training', label: 'Antiterrorism Level 1 Training' },
      { slug: 'combating-trafficking-in-persons-training', label: 'Combating Trafficking in Persons (CTIP)' },
      { slug: 'cui-training', label: 'CUI Training' },
      { slug: 'pii-training', label: 'PII Training' },
      { slug: 'insider-threat-awareness-training', label: 'Insider Threat Awareness Training' },
      { slug: 'tarp-training', label: 'TARP Training' },
      { slug: 'law-of-war-training', label: 'Law of War Training' },
      { slug: 'sere-100-2-training', label: 'SERE 100.2 Training' },
    ],
  },
  {
    title: 'Workplace Compliance',
    pages: [
      { slug: 'hipaa-training', label: 'HIPAA Training' },
      { slug: 'sexual-harassment-prevention-training', label: 'Sexual Harassment Prevention Training' },
      { slug: 'active-shooter-training', label: 'Active Shooter Training' },
      { slug: 'osha-10-hour-training', label: 'OSHA 10-Hour Training' },
      { slug: 'anti-money-laundering-training', label: 'Anti-Money Laundering (AML) Training' },
    ],
  },
  {
    title: 'Career & Aptitude Tests',
    pages: [
      { slug: 'ccat-practice-test', label: 'CCAT Practice Test' },
      { slug: 'wonderlic-test-practice', label: 'Wonderlic Test Practice' },
      { slug: 'predictive-index-cognitive-assessment', label: 'Predictive Index Cognitive Assessment' },
      { slug: 'shl-test-practice', label: 'SHL Test Practice' },
      { slug: 'caliper-assessment-practice', label: 'Caliper Assessment Practice' },
      { slug: 'hogan-assessment-practice', label: 'Hogan Assessment Practice' },
      { slug: 'asvab-practice-test', label: 'ASVAB Practice Test' },
      { slug: 'pmp-exam-practice', label: 'PMP Exam Practice' },
    ],
  },
];
