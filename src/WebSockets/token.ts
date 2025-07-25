// let cachedToken: string | null = localStorage.getItem('authToken') || null;

// async function loginAndGetToken(): Promise<string> {
//   const response = await fetch('https://backend.inferixai.link/api/login', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'X-CSRF-Token': 'jwfuC6iVZ68_xaqQP774IhsEcOKeB7q89SSpZYtBl9U'
//     },
//     body: JSON.stringify({
//       username: 'demo12',
//       password: '12345678'
//     })
//   });

//   const data = await response.json();
//   localStorage.setItem('authToken', data.token);
//   cachedToken = data.token;
//   return data.token;
// }

// async function tryWebSocketConnection(token: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     const ws = new WebSocket(`wss://backend.inferixai.link/user/auth?authorization=Bearer ${token}`);
    
//     const timeout = setTimeout(() => {
//       ws.close();
//       resolve(false); // Timeout fallback
//     }, 3000);

//     ws.onopen = () => {
//       clearTimeout(timeout);
//       ws.close(); // Only checking validity
//       resolve(true);
//     };

//     ws.onerror = () => {
//       clearTimeout(timeout);
//       resolve(false); // Failed connection (likely expired)
//     };
//   });
// }

// export async function getValidToken(): Promise<string> {
//   if (cachedToken && await tryWebSocketConnection(cachedToken)) {
//     return cachedToken;
//   }

//   const newToken = await loginAndGetToken();
//   return newToken;
// }

export const gametoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTM0NDQ5MzAsIm9wZXJhdG9ySWQiOiJCT1VHRUUiLCJzZXNzaW9uSWQiOiIyZGI4YzdkYy0xMmIwLTRjM2QtYmIwMy0yOWUxMTI5NDc0MWIiLCJ1c2VySWQiOiJkZW1vMTIiLCJ1c2VybmFtZSI6ImRlbW8xMiJ9.GXAQXaGW5Db_cEYkro6nWblCfzfKuVDhEmEAekozpFg"