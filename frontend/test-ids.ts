// Every data-testid in the app comes from here. Tests find elements only by these ids.
export const testIds = {
  setup: {
    form: 'setup-form',
    siteSelect: 'setup-site-select',
    siteError: 'setup-site-error',
    coords: 'setup-coords',
    coordsError: 'setup-coords-error',
    date: 'setup-date',
    hour: 'setup-hour',
    stay: 'setup-stay',
    submit: 'setup-submit',
  },
  hero: { image: 'hero-image', credit: 'hero-credit' },
} as const;
