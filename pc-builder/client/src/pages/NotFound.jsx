import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: 80 }}>
      <Seo title="Not found" />
      <h1>404</h1>
      <p>That page is not on the forge.</p>
      <Link to="/">Home</Link>
    </div>
  );
}
