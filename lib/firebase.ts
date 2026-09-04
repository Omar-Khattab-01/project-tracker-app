import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web configuration is public. Access is enforced by Authentication and Firestore rules.
export const firebaseConfig = {
  projectId: 'project-tracker-837f9',
  appId: '1:612839405181:web:f32a1f705cd0d75d21a314',
  apiKey: 'AIzaSyA0NqQb9Jb9D3jBT1kYqawaVt-HJI4XyVY',
  authDomain: 'project-tracker-837f9.firebaseapp.com',
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
