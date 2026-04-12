import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('App', () => {
  test('home shows hero and start links', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/PrompTetris/i);
    const start = screen.getAllByRole('link', { name: /start game/i });
    expect(start.length).toBeGreaterThanOrEqual(1);
  });

  test('play route shows FinSim allocation game', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('link', { name: /start game/i })[0]);
    expect((await screen.findAllByText(/Month 1/i)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /start month/i }));
    expect(screen.getByText(/FinSim/i)).toBeInTheDocument();
  });
});
