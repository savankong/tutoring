import ZineHeader from '../../components/zine/ZineHeader.jsx';

const NAV_ITEMS = [
  { label: 'Sample questions', href: '#sample-questions' },
  { label: 'FAQ', href: '#faq' },
];

function LpHeader() {
  return <ZineHeader navItems={NAV_ITEMS} />;
}

export default LpHeader;
