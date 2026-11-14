// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../i18n';
import { testIds } from '../../test-ids';
import CopyLinkButton from './CopyLinkButton';

const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const stubClipboard = (value: unknown) => Object.defineProperty(navigator, 'clipboard', { value, configurable: true });

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  history.replaceState(null, '', '/?zoom=year');
});
afterEach(() => {
  if (original) Object.defineProperty(navigator, 'clipboard', original);
  else Reflect.deleteProperty(navigator, 'clipboard');
});

const mount = async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <CopyLinkButton />
      </QueryClientProvider>,
    ),
  );
  const button = host.querySelector<HTMLButtonElement>(`[data-testid="${testIds.scenarioBar.copyLink}"]`)!;
  const status = host.querySelector<HTMLElement>(`[data-testid="${testIds.scenarioBar.copyStatus}"]`)!;
  return { button, status, click: () => act(async () => button.click()) };
};

test('before any click: a button of type button with data-status idle, and an empty status region', async () => {
  const { button, status } = await mount();
  expect(button.tagName).toBe('BUTTON');
  expect(button.getAttribute('type')).toBe('button');
  expect(button.dataset.status).toBe('idle');
  expect(status.getAttribute('role')).toBe('status');
  expect(status.textContent).toBe('');
});

test('a click writes location.href once and the status becomes copied', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  stubClipboard({ writeText });
  const { button, status, click } = await mount();
  await click();
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(location.href);
  expect(button.dataset.status).toBe('copied');
  expect(status.textContent).not.toBe('');
});

describe('failures', () => {
  test('writeText rejecting with NotAllowedError gives failed', async () => {
    stubClipboard({ writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) });
    const { button, status, click } = await mount();
    await click();
    expect(button.dataset.status).toBe('failed');
    expect(status.textContent).not.toBe('');
  });

  test('navigator.clipboard undefined gives failed', async () => {
    stubClipboard(undefined);
    const { button, click } = await mount();
    await click();
    expect(button.dataset.status).toBe('failed');
  });
});

test('a second click goes back to idle before the write settles, then copied', async () => {
  let settle: () => void = () => {};
  const writeText = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockImplementationOnce(() => new Promise<void>((r) => (settle = r)));
  stubClipboard({ writeText });
  const { button, status, click } = await mount();
  await click();
  expect(button.dataset.status).toBe('copied');
  await act(async () => {
    button.click();
  });
  expect(button.dataset.status).toBe('idle');
  expect(status.textContent).toBe('');
  await act(async () => settle());
  expect(button.dataset.status).toBe('copied');
  expect(writeText).toHaveBeenCalledTimes(2);
});

test('after a failure, a later successful click shows copied', async () => {
  const writeText = vi.fn().mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError')).mockResolvedValueOnce(undefined);
  stubClipboard({ writeText });
  const { button, click } = await mount();
  await click();
  expect(button.dataset.status).toBe('failed');
  await click();
  expect(button.dataset.status).toBe('copied');
});
