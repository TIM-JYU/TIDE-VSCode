import { render } from '@testing-library/svelte';
import LoaderButton from '../LoaderButton.svelte';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

describe('LoaderButton', () => {
  it('LoaderButton is rendered into view', () => 
  {
        const { getByText } = render(LoaderButton as any, {
        props: {
            loading: false,
            text: 'Click Me',
        },
        });
        const button = getByText('Click Me');
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Click Me');     
  });
});
