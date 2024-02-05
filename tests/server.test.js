const http = require('http');
//const app = require('../server.mjs');

describe('POST /api/data', () => {
  test('responds with 201 INSERT OK', (done) => {
    const request = http.request(
      {
        hostname: 'localhost',
        port: 2000,
        path: '/store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          expect(response.statusCode).toBe(201);
          expect(JSON.parse(data)).toEqual({ success: true });
          done();
        });
      }
    );

    request.write(JSON.stringify({ key: 'value' }));
    request.end();
  });
});


describe('DELETE /api/data', () => {
  test.skip('responds with 200 OK', (done) => {
    const request = http.request(
      {
        hostname: 'localhost',
        port: 2000,
        path: '/posts',
        method: 'DELETE',
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          expect(response.statusCode).toBe(200);
          expect(JSON.parse(data)).toEqual({ status: 'success' });
          done();
        });
      }
    );

    request.end();
  });
});
