import { permanentRedirect } from 'next/navigation';

export default function LegacyRestorePage() {
  permanentRedirect('/methodology');
}
