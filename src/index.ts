import express from 'express';
import axios from 'axios';
import config from 'config';
import { getContext, Publisher } from './points.js';
// @ts-ignore
import { generateGameResults, generatePlayerResults } from './nba.js';

const app = express();
let publisher: Publisher;

interface Source {
  name: string;
  endpoint: string;
  pointModel: string;
  intervalMS: number;
  tokenEnvVar: string;
  mapping: Record<string, string>;
}

// reads from config/default.json
function readConfig(): Source[] {
  return config.get('sources');
}

async function fetchData(source: Source) {
  let endpoint;
  try {
    const token = process.env[source.tokenEnvVar];
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    // special handling per source, factor this out
    endpoint = source.endpoint
    if (source.name == 'nba_games' || source.name == 'nba_stats') {
        let yesterday: string = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        // start and end dates are inclusive
        endpoint = `${endpoint}?start_date=${yesterday}&end_date=${yesterday}`

        // they do not use Bearer
        headers['Authorization'] = `${token}`
    }
    const response = await axios.get(endpoint, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
  }
}

async function runPipe(source: Source) {
  // Process the fetched data based on the source configuration
  // You can customize this function based on your specific requirements
  console.log(`fetching from ${source.name}`);
  const rawData = await fetchData(source)

  console.log(`Processing data for ${source.pointModel}:`, rawData);
  let generator;
  // map to the appropriate generator
  if (source.name == 'nba_games') {
     generator = generateGameResults(rawData['data'])
  } else if (source.name == 'nba_stats') {
     generator = generatePlayerResults(rawData['data'])
  }

  if (! generator) {
     return
  }

  for (let pointData of generator) {
    // Here you process and publish each PointData
    await publisher.publishPoints(pointData);
  }
}

function startRetrievalInterval(source: Source) {
  setInterval(() => runPipe(source), source.intervalMS);
}

async function startBackgroundTasks() {
  for (const source of readConfig()) {
    console.log("Starting first run for " + source.name);
    await runPipe(source);
    startRetrievalInterval(source);
  }
}

app.listen(3000, async () => {
  const ceramic = await getContext()
  publisher = new Publisher(ceramic);
  console.log('Server is running on port 3000');
  await startBackgroundTasks();
  console.log('All sources started');
});
