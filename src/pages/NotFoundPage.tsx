import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page-pad page-center">
      <div className="page-wrap narrow center">
        <h1 className="page-title">404</h1>
        <p className="page-desc">
          That page doesn&apos;t exist. Go back to the game or home.
        </p>
        <div className="stack-btns">
          <Link to="/" className="btn-secondary-lg">
            Home
          </Link>
          <Link to="/play" className="btn-primary-lg">
            Play
          </Link>
        </div>
      </div>
    </div>
  );
}
