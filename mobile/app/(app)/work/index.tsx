import { Redirect } from 'expo-router';

// Redirect /work to the projects list as the default "Work" tab view
export default function WorkIndex() {
  return <Redirect href="/work/projects" />;
}
