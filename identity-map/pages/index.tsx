-import { useState } from 'react';
+import { useState } from 'react';
+import { useRouter } from 'next/router';
 import type { ApiError, JoinSessionResponse } from '../types';

 export default function JoinSessionPage() {
+  const router = useRouter();
   const [code, setCode] = useState('');
   const [displayName, setDisplayName] = useState('');
   const [consent, setConsent] = useState(false);
   const [visible, setVisible] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [successMessage, setSuccessMessage] = useState<string | null>(null);

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setError(null);
     setSuccessMessage(null);

     if (loading) return;

     if (!consent) {
       setError('You must give consent to join the session.');
       return;
     }

     setLoading(true);
     try {
       const response = await fetch('/api/joinSession', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           code: code.trim(),
           displayName: displayName.trim(),
           consentGiven: consent,
           isVisible: visible,
         }),
       });
-      const data: JoinSessionResponse | ApiError = await response.json();
+      const data: JoinSessionResponse | ApiError = await response.json();

       if (!response.ok) {
         setError((data as ApiError).message ?? 'Failed to join session');
       } else {
-        setSuccessMessage(`Welcome, ${displayName.trim()}!`);
-        // reset form
-        setCode('');
-        setDisplayName('');
-        setConsent(false);
-        setVisible(false);
+        // ✅ Expect the API to return the new participant's ID
+        //    Adjust the key here if your API uses a different name (e.g. `id`)
+        const participantId =
+          (data as JoinSessionResponse).participantId ??
+          // fallbacks if your API used a different key
+          (data as any).id ??
+          (data as any).participantID;
+
+        if (!participantId || typeof participantId !== 'string') {
+          // Defensive: if API didn’t return an id, surface a clear error
+          setError('Join succeeded but participantId was not returned.');
+          return;
+        }
+
+        // Store for My Identity page
+        localStorage.setItem('participantId', participantId);
+
+        // Optional: friendly message (won’t be seen if we navigate immediately)
+        setSuccessMessage(`Welcome, ${displayName.trim()}!`);
+
+        // Go straight to My Identity
+        router.push('/my-identity');
       }
     } catch (err) {
       setError('Unexpected error occurred');
     } finally {
       setLoading(false);
     }
   };
