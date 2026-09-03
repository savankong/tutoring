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
      { slug: 'dod-annual-security-awareness-refresher-training', label: 'DoD Annual Security Awareness Refresher' },
      { slug: 'derivative-classification-training', label: 'Derivative Classification Training' },
      { slug: 'sapr-training', label: 'SAPR Training' },
      { slug: 'suicide-prevention-training', label: 'Suicide Prevention (ACE) Training' },
      { slug: 'marking-classified-information-training', label: 'Marking Classified Information Training' },
      { slug: 'anti-terrorism-level-2-training', label: 'Antiterrorism Level II Training' },
      { slug: 'counterintelligence-awareness-training', label: 'Counterintelligence Awareness Training' },
      { slug: 'privileged-user-cybersecurity-training', label: 'Privileged User Cybersecurity Responsibilities' },
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
      { slug: 'bloodborne-pathogens-training', label: 'Bloodborne Pathogens Training' },
      { slug: 'osha-30-hour-training', label: 'OSHA 30-Hour Training' },
      { slug: 'forklift-certification-training', label: 'Forklift Certification Training' },
      { slug: 'food-handler-card-practice-test', label: 'Food Handler Card Practice Test' },
      { slug: 'servsafe-manager-exam-practice', label: 'ServSafe Manager Exam Practice' },
      { slug: 'hazwoper-40-hour-training', label: 'HAZWOPER 40-Hour Training' },
      { slug: 'california-mandated-reporter-training', label: 'California Mandated Reporter Training' },
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
  {
    title: 'Professional Certifications',
    pages: [
      { slug: 'comptia-security-plus-practice-test', label: 'CompTIA Security+ Practice Test' },
      { slug: 'comptia-a-plus-practice-test', label: 'CompTIA A+ Practice Test' },
      { slug: 'aws-cloud-practitioner-practice-test', label: 'AWS Cloud Practitioner Practice Test' },
      { slug: 'nclex-rn-practice-questions', label: 'NCLEX-RN Practice Questions' },
      { slug: 'teas-7-practice-test', label: 'TEAS 7 Practice Test' },
      { slug: 'sie-exam-practice', label: 'SIE Exam Practice' },
      { slug: 'ptce-practice-test', label: 'PTCE (Pharmacy Tech) Practice Test' },
      { slug: 'epa-608-practice-test', label: 'EPA 608 Practice Test' },
    ],
  },
  {
    title: 'State Licensing & Exams',
    pages: [
      { slug: 'texas-real-estate-exam-prep', label: 'Texas Real Estate Exam Prep' },
      { slug: 'california-real-estate-exam-prep', label: 'California Real Estate Exam Prep' },
      { slug: 'florida-real-estate-exam-prep', label: 'Florida Real Estate Exam Prep' },
      { slug: 'life-and-health-insurance-license-exam-prep', label: 'Life & Health Insurance License Exam Prep' },
      { slug: 'cdl-general-knowledge-practice-test', label: 'CDL General Knowledge Practice Test' },
      { slug: 'texas-food-handler-card-practice-test', label: 'Texas Food Handler Card Practice Test' },
      { slug: 'california-food-handler-card-practice-test', label: 'California Food Handler Card Practice Test' },
    ],
  },
];
