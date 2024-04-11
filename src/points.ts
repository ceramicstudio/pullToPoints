//import { fromString } from 'uint8arrays';
import { CeramicClient } from "@ceramicnetwork/http-client";
import type { CeramicAPI } from '@composedb/types'
import { getAuthenticatedDID } from '@composexp/did-utils'
import { PointsReader, PointsWriter } from '@composexp/points'
import { fromString } from 'uint8arrays';

export interface PointData {
  recipient: string;
  model: string;
  context: string;
  amt: number;
}

export const getContext = async () => {

  const CERAMIC_URL = process.env.CERAMIC_URL || "";
  const CERAMIC_PRIVATE_KEY = process.env.CERAMIC_PRIVATE_KEY || "";
  const key = fromString(CERAMIC_PRIVATE_KEY, "base16");

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
      writer = new PointsWriter({ceramic:this.ceramic, aggregationModelID:pointData.model});
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
    // TODO if there is an allocation model, first try to allocate, skip aggregation if set error

    // Do we already have an aggregation document?
    const doc = await reader.loadAggregationDocumentFor(recipient)
    console.log("Doc is: " + JSON.stringify(doc));
    console.log("Writer is")
    console.log(writer)
    if (! doc) {
      // no, we need to create one
      await writer.setPointsAggregationFor([recipient], amt, {
        recipient,
        points: amt,
        date: new Date().toISOString(),
      });
    } else {
      // we have one already, just update the total
      await writer.updatePointsAggregationFor(
        recipient, 
        (content: any) => ({
            points: content ? content.points + amt : amt,
            date: new Date().toISOString(),
            recipient,
          })
       ); 
    }
    console.log("published: " + JSON.stringify(pointData));
  }
}


