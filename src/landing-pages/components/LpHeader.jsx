import ZineHeader from '../../components/zine/ZineHeader.jsx';

const NAV_ITEMS = [
  { label: 'Sample questions', href: '#sample-questions' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Resources', href: '#resources' },
];

function LpHeader() {
  return <ZineHeader navItems={NAV_ITEMS} />;
}

export default LpHeader;
