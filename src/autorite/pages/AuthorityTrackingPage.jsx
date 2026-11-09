import AutoriteShell from '../desktop/AutoriteShell';
import { ManageAuthoritiesPageContent } from './ManageAuthoritiesPage';

export default function AuthorityTrackingPage() {
  return (
    <AutoriteShell>
      <ManageAuthoritiesPageContent defaultTab="tracking" />
    </AutoriteShell>
  );
}
