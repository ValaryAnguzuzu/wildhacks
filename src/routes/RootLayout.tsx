import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { NavBar } from '../components/NavBar';
import { SiteFooter } from '../components/SiteFooter';

export function RootLayout() {
  const { pathname } = useLocation();
  const isPlay = pathname === '/play';

  return (
    <div className={`site-shell ${isPlay ? 'site-shell-play' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <NavBar />
      <main className="site-main" id="main-content">
        <Outlet />
      </main>
      {!isPlay && <SiteFooter />}
    </div>
  );
}
