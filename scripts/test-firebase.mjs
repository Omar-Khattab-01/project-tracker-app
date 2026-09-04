import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocFromServer, deleteDoc, serverTimestamp, terminate } from 'firebase/firestore';

const config = {apiKey:'AIzaSyA0NqQb9Jb9D3jBT1kYqawaVt-HJI4XyVY',projectId:'project-tracker-837f9'};
const run = randomUUID();
const clients = ['a','b','anonymous'].map(label => {const app=initializeApp(config,`${run}-${label}`);return {app,auth:getAuth(app),db:getFirestore(app)};});
const [a,b,anon]=clients;
const password = randomUUID() + 'Aa1!';
const email = `tracker-test-${run}@example.invalid`;
let ref;
async function denied(action,label){await assert.rejects(action,e=>e.code==='permission-denied');console.log(`PASS ${label}`);}
try {
  await createUserWithEmailAndPassword(a.auth,email,password);
  await createUserWithEmailAndPassword(b.auth,`tracker-test-b-${run}@example.invalid`,password);
  ref=doc(a.db,'workspaces',a.auth.currentUser.uid);
  await setDoc(ref,{projects:[{id:1,name:'Disposable verification project',tasks:[]}],updatedAt:serverTimestamp()});
  assert.equal((await getDocFromServer(ref)).data().projects[0].name,'Disposable verification project');
  console.log('PASS authenticated create and read');
  await denied(()=>getDocFromServer(doc(b.db,ref.path)),'other account cannot read');
  await denied(()=>setDoc(doc(b.db,ref.path),{projects:[],updatedAt:serverTimestamp()}),'other account cannot overwrite');
  await denied(()=>getDocFromServer(doc(anon.db,ref.path)),'signed-out client cannot read');
  await denied(()=>setDoc(ref,{projects:'invalid',updatedAt:serverTimestamp()}),'invalid document rejected');
  await signOut(a.auth);
  await signInWithEmailAndPassword(a.auth,email,password);
  assert.equal((await getDocFromServer(ref)).data().projects.length,1);
  console.log('PASS data survives sign-out and sign-in');
} finally {
  if(ref && a.auth.currentUser) await deleteDoc(ref);
  for(const client of clients){if(client.auth.currentUser)await deleteUser(client.auth.currentUser);await terminate(client.db);await deleteApp(client.app);}
  console.log('Temporary accounts and test document removed.');
}
