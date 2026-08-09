import http from 'k6/http';
import { check } from 'k6';

const URL = 'https://www.manadryfruits.com/api/reviews?slug=seed-nut-mix';

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
    const response = http.get(URL);

    check(response, {
        'reviews API returns 200': (r) => r.status === 200,
    });
}