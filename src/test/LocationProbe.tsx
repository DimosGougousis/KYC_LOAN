import { useLocation } from 'react-router-dom';

export function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="location">{loc.pathname}</output>;
}
