# Pull from APIs and Publish Points

General harness and example for pulling data from API endpoints and publishing as Points on the Ceramic Network, in an idempotent manner that avoids double-counting.

This repo contains a working example of pulling NBA team wins, losses and player stats. 

### Prerequisites

In order to run this harness, it is necessary to have a Ceramic node, in the environment vars

```
CERAMIC_URL
CERAMIC_PRIVATE_KEY
```

and an API token for wherever you are retrieving data from.  In particular for this example, you will need

```
BALLDONTLIE_TOKEN
```
To run a ceramic node, see the [Ceramic Developer Documentation](https://developers.ceramic.network/) 
For the API token, see [balldontlie.io](https://balldontlie.io)

### Install and run

pnpm install
pnpm build
pnpm start

This will retrieve the last days' game outcomes and player statistics, and will aggregate wins & losses by team, and minutes played, assists and points scored by player.

### How it Works

All of the code specific to the ComposeDB Points system is encapsulated in the [points](src/points.ts) module, which uses the models created in the [composites](composites/) directory.

The SET relation on the Allocation methods is what enforces that points for the given field combination can only be counted once (ie for one team and game date), used in the publishPoints function.

The Aggregation methods keep the running totals in a single Model Instance Document which makes it quick to retrieve the aggregations from the decentralized network.

### Integration to Projects

The intention of this example repository is to be cloned and modified or extended, or to serve as an example for including decentralized data functionality for allocation and aggregation - for Points - within an existing project.  
 
The `points` npm module is available [here](https://github.com/ceramicstudio/solutions)
