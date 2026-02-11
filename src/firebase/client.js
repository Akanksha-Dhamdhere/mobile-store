// Firebase client module - disabled
// Google Sign-In has been removed from this application
// Please use email/password authentication instead

export const isGoogleSignInEnabled = () => false;
export const isFirebaseConfigValid = () => false;

export async function signInWithGoogle() {
  throw new Error('Google Sign-In is not available in this application');
}

export const auth = null;




