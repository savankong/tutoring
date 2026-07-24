import Sidebar from '../../components/Sidebar.jsx';

const NAV_ITEMS = [
  { label: 'Sample questions', href: '#sample-questions' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Resources', href: '#resources' },
];

function LpHeader() {
  return <Sidebar navItems={NAV_ITEMS} />;
}

export default LpHeader;
