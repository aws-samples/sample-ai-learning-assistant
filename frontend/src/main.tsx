import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client';
import App from './App.tsx'
import "@aws-amplify/ui-react/styles.css";
import './index.css';
import "./locales/config.ts";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
      <App />
  </StrictMode>,
)
