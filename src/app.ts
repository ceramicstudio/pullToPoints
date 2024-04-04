import express from 'express';
import axios from 'axios';
import config from 'config';

const app = express();

interface Endpoint {
  name: string;
  endpoint: string;
  pointModel: string;
  interval: number;
  tokenEnvVar: string;
  mapping: Record<string, string>;
}

function readConfig(): Endpoint[] {
  return config.get('endpoints');
}

async function fetchData(endpoint: Endpoint) {
  try {
    const token = process.env[endpoint.tokenEnvVar];
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await axios.get(endpoint.endpoint, { headers });
    const data = response.data;
    processData(endpoint, data);
  } catch (error) {
    console.error(`Error fetching data from ${endpoint.endpoint}:`, error);
  }
}

function processData(endpoint: Endpoint, data: any) {
  // Process the fetched data based on the endpoint configuration
  // You can customize this function based on your specific requirements
  console.log(`Processing data for ${endpoint.pointModel}:`, data);
  // Use endpoint.mapping to map the fetched data to the desired structure
}

function startRetrievalInterval(endpoint: Endpoint) {
  setInterval(() => fetchData(endpoint), endpoint.interval);
}

function startBackgroundTasks() {
  const endpoints = readConfig();
  endpoints.forEach(endpoint => {
    startRetrievalInterval(endpoint);
  });
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
  startBackgroundTasks();
});
