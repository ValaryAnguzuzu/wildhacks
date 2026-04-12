import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('PrompTetris App', () => {
  test('home shows hero and start links', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/PrompTetris/i);
    const start = screen.getAllByRole('link', { name: /start game/i });
    expect(start.length).toBeGreaterThanOrEqual(1);
  });

  test('play route shows level HUD', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('link', { name: /start game/i })[0]);
    expect(
      await screen.findByText(/How does ChatGPT actually work\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/lvl\s*1/i)).toBeInTheDocument();
  });
});
