//import { fromString } from 'uint8arrays';
import { CeramicClient } from "@ceramicnetwork/http-client";
import type { CeramicAPI } from '@composedb/types'
import { getAuthenticatedDID } from '@composexp/did-utils'
import { PointsReader, PointsWriter } from '@composexp/points'
import { fromString } from 'uint8arrays';

export interface PointData {
  recipient: string;
  model: string;
  allocationModel: string;
  allocationFields: string[],
  allocationData: any;
  amt: number;
}

export const getContext = async () => {

  const CERAMIC_URL = process.env.CERAMIC_URL || "";
  const CERAMIC_PRIVATE_KEY = process.env.CERAMIC_PRIVATE_KEY || "";
  const key = fromString(CERAMIC_PRIVATE_KEY, "base16");

  if (! CERAMIC_URL) {
     console.log("Please set CERAMIC_URL and CERAMIC_PRIVATE_KEY in your environment")
     process.exit()
  }

  console.log("Using ceramic node at " + CERAMIC_URL)
  const ceramic = new CeramicClient(CERAMIC_URL);
  ceramic.did = await getAuthenticatedDID(key);

  return ceramic;
};


export class Publisher {
  private modelWriters = new Map<string, any>();
  private modelReaders = new Map<string, any>();

  constructor(private ceramic: CeramicAPI) {
    if (! ceramic.did || ! ceramic.did.authenticated) {
        throw("Must use an authenticated ceramic instance");
    }
  }

  async publishPoints(pointData: PointData) {
    let writer = this.modelWriters.get(pointData.model);
    let reader = this.modelReaders.get(pointData.model);

    const recipient = pointData.recipient
    const amt = pointData.amt

    if (!writer) {
      writer = new PointsWriter({ceramic:this.ceramic, 
                                 aggregationModelID:pointData.model,
                                 allocationModelID: pointData.allocationModel});
      this.modelWriters.set(pointData.model, writer);
    }
    if (!reader) {
      reader = new PointsReader({
           ceramic:this.ceramic,
           issuer: this.ceramic.did!.id,
           aggregationModelID:pointData.model
      });
      this.modelReaders.set(pointData.model, reader);
    }
    // Check if the allocation already exists; if not, set it
    const loader = reader.loader
    const issuer = this.ceramic.did!.id 
    const uniq_array = [recipient]

    for (const field of pointData.allocationFields) {
        console.log(` appending ${field} with data ${pointData.allocationData[field]}`)
        uniq_array.push(pointData.allocationData[field])
    }

    const allocDoc = await loader.loadSet(issuer, pointData.allocationModel, uniq_array, {})
    const content = allocDoc?.content
    if (content) {
       // we have already allocated this!
       console.log("repeat allocation, skipping" + content)
       return
    }
    // we are not actually recording the points because we get an immutable error
    // but it will protect us against re-allocating
    console.log({ recipient: recipient, ...pointData.allocationData })
    await allocDoc!.replace({
      // Copy existing content or set recipient (assuming it's the first value)
      ...(content ?? { recipient: recipient, ...pointData.allocationData }),
    })
//    await allocDoc!.replace({...allocDoc!.content, points: amt})
    // now we have set the allocation

    // Do we already have an aggregation document?
    const doc = await reader.loadAggregationDocumentFor(recipient)
    let result
    if (! doc) {
      // no, we need to create one
      result = await writer.setPointsAggregationFor([recipient], amt, {
        recipient,
        points: amt,
        date: new Date().toISOString(),
      });
    } else {
      // we have one already, just update the total
      result = await writer.updatePointsAggregationFor(
        recipient, 
        (content: any) => ({
            points: content ? content.points + amt : amt,
            date: new Date().toISOString(),
            recipient,
          })
       ); 
    }
    console.log(result.id)
    console.log("published: " + JSON.stringify(pointData));
  }
}


