import './App.css';
import MyMenu from './components/MyMenu';
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';
import '@aws-amplify/ui-react/styles.css';
import Home from './components/Home';
import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Authenticator } from '@aws-amplify/ui-react';
import awsExports from '../aws-exports';
import { AuthEventData } from '@aws-amplify/ui';

/**
 * Configures the AWS Amplify library with the necessary settings.
 * This includes configuring the Cognito user pool, identity pool, and API settings.
 */
Amplify.configure(config);

const existingConfig = Amplify.getConfig();

Amplify.configure({
  ...existingConfig,
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || awsExports.userPoolId,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || awsExports.userPoolClientId,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || awsExports.identityPoolId,
      allowGuestAccess: false,
      loginWith: {
        oauth: {
          domain: `${import.meta.env.VITE_USER_POOL_DOMAIN_NAME || awsExports.userPoolDomainName}.auth.${import.meta.env.VITE_REGION || awsExports.region}.amazoncognito.com`,
          redirectSignIn: [window.location.origin],
          redirectSignOut: [window.location.origin],
          scopes: [
            "email",
            "openid",
            "phone",
            "profile",
            "aws.cognito.signin.user.admin"
          ],
          responseType: 'code',

        },
        username: true,
        email: true
      }
    }
  },
  API: {
    REST: {
      [import.meta.env.VITE_API_NAME || awsExports.apiName]: {
        endpoint: import.meta.env.VITE_API_URL || awsExports.apiURL
      }
    }
  }
});

/**
 * The main App component.
 * It uses the Authenticator component from AWS Amplify to handle user authentication.
 * When a user is signed in, it renders the main content of the application.
 */
function App() {

  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.resolvedLanguage ? i18n.resolvedLanguage : "en");

   /**
   * Handles the user sign-out process.
   * It clears the cached AWS credentials before signing the user out.
   * @param signOut - The sign-out function provided by the Authenticator component.
   */
  async function handleSignOut(signOut: { (data?: AuthEventData | undefined): void; (): void; }) {
    signOut();
  }

  return (
    <Authenticator >
      {({ signOut }) => (
        <main>
          <div className="App">
            {signOut && <MyMenu signOut={() => handleSignOut(signOut)} language={language} setLanguage={setLanguage} />}
            <Home />
          </div>
        </main>
      )}
    </Authenticator>
  );
}

export default App; 