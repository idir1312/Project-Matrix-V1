import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';

describe('Home Page', () => {
  test('switching tabs triggers correct fetch path', () => {
    global.fetch = jest.fn();
    const { getByText } = render(<Home />);
    fireEvent.click(getByText('Infrastructure'));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/infrastructure/projects'));
  });
}); 