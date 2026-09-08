import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '3m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
    'http_req_duration{name:home}': ['p(95)<500'],
    'http_req_duration{name:inscription_page}': ['p(95)<500'],
    'http_req_duration{name:inscription_api}': ['p(95)<1000'],
    'http_req_duration{name:video}': ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  let resHome = http.get(`${BASE_URL}/`, { tags: { name: 'home' } });
  check(resHome, {
    'Accueil OK (200)': (r) => r.status === 200,
  });
  sleep(Math.random() * 2 + 1);

  let resInscriptionPage = http.get(`${BASE_URL}/inscription`, { tags: { name: 'inscription_page' } });
  check(resInscriptionPage, {
    'Page Inscription OK (200)': (r) => r.status === 200,
  });
  sleep(Math.random() * 2 + 1);

  const payload = JSON.stringify({
    name: `Utilisateur ${__VU}-${__ITER}`,
    email: `test_${__VU}_${__ITER}_${Date.now()}@example.fr`,
    password: 'Password123!',
    dateOfBirth: '1995-05-15T00:00:00.000Z',
    localisation: 'Paris 75000',
    acceptedTerms: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
    },
    tags: { name: 'inscription_api' },
  };

  let resInscriptionApi = http.post(`${BASE_URL}/api/auth/sign-up/email`, payload, params);

  check(resInscriptionApi, {
    'Inscription API OK (200)': (r) => r.status === 200,
  });
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'rapport_performance.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}