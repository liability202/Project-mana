import http from 'k6/http';
import { check } from 'k6';

const SUPABASE_URL =
    'https://dktkyiwuegyievucnoxc.supabase.co/rest/v1/products?select=*&slug=eq.seed-nut-mix';

const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
    stages: [
        { duration: '20s', target: 25 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '20s', target: 150 },
        { duration: '20s', target: 200 },
        { duration: '20s', target: 250 },
        { duration: '20s', target: 0 },
    ],

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<2000'],
    },
};

export default function () {
    const response = http.get(SUPABASE_URL, {
        headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
        },
    });

    check(response, {
        'Supabase returns 200': (r) => r.status === 200,
        'product returned': (r) => r.body && r.body.length > 0,
    });
}