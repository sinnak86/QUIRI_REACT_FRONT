const BASE_URL = 'http://localhost:8080/api';

export interface TestResponse {
  message: string;
  status: string;
  timestamp: string;
}

export async function testBackendConnection(): Promise<TestResponse> {
  const response = await fetch(`${BASE_URL}/test`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}
