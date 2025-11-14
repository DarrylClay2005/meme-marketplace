import React from 'react';
import { getCognitoSignupUrl } from '../auth';

export const RegisterPage: React.FC = () => {
  const signupUrl = getCognitoSignupUrl();

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Create an Account</h1>
      <p className="text-sm text-slate-300">
        Meme Marketplace uses <span className="font-semibold">Amazon Cognito</span> to handle
        secure sign-up and login. When you click the button below, you will be redirected to
        the Cognito Hosted UI where you can register with your email and password.
      </p>
      <p className="text-sm text-slate-300">
        After you sign up, Cognito will send you back to this site with a secure access token
        so you can upload memes, like memes, and record purchases.
      </p>
      <a
        href={signupUrl}
        className="inline-block px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
      >
        Register with Cognito
      </a>
    </div>
  );
};
