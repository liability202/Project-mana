import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://www.manadryfruits.com';

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
        http_req_duration: ['p(95)<3000'],
    },
};

export default function () {

    // 1. Homepage
    let response = http.get(BASE_URL);

    check(response, {
        'homepage OK': (r) => r.status === 200,
    });

    sleep(1);


    // 2. Product page
    response = http.get(
        `${BASE_URL}/products/seed-nut-mix`
    );

    check(response, {
        'product page OK': (r) => r.status === 200,
    });

    sleep(2);
}