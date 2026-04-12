import './index.css';
import './styles/layout.css';
import './styles/home-zigzag.css';
import './styles/game-arena.css';
import './styles/answer-key.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
