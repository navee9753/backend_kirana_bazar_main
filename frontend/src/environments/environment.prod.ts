export const environment = {
  production: true,
  apiBaseUrl: (window as any)['env']?.apiUrl || ''
};
