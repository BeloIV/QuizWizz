import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
});

afterEach(() => {
  if (global.fetch?.mockRestore) {
    global.fetch.mockRestore();
  }
  delete global.fetch;
});

test('renders QuizWizz header brand', async () => {
  render(<App />);
  const brand = await screen.findByText('QuizWizz');
  expect(brand).toBeInTheDocument();
});
