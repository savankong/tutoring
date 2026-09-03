import ZineHeader from '../../components/zine/ZineHeader.jsx';

// Separate from LpHeader (which anchors to #sample-questions, a section
// school hub pages don't have) — hub pages get their own nav targets.
const NAV_ITEMS = [
  { label: 'Your courses', href: '#courses' },
  { label: 'FAQ', href: '#faq' },
];

function HubHeader() {
  return <ZineHeader navItems={NAV_ITEMS} />;
}

export default HubHeader;
