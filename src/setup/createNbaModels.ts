import { readFileSync } from "fs";
import { Composite } from '@composedb/devtools'
import {
  readEncodedComposite,
  writeEncodedComposite,
  writeEncodedCompositeRuntime,
} from "@composedb/devtools-node";
import { getContext } from '../points.js';

(async () => {
  const ceramic = await getContext();

  console.log("One-time Creation of NBA Models");
 
  const nbaSchema = readFileSync("./composites/nba.graphql", { 
    encoding: "utf-8",
  })

  const composite = await Composite.create({ceramic, schema: nbaSchema});

  await writeEncodedComposite(composite, "./src/__generated__/nba_definition.json");
  await writeEncodedCompositeRuntime(
    ceramic, 
    "./src/__generated__/nba_definition.json",
    "./src/__generated__/nba_definition.js"
  );

  const deployComposite = await readEncodedComposite(
    ceramic,
    "./src/__generated__/nba_definition.json"
  );

  await deployComposite.startIndexingOn(ceramic);

  console.log("NBA models created and ready to use - set the model ids in the code to match");
 
})();
