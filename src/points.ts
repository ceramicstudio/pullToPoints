//import { fromString } from 'uint8arrays';
import { CeramicClient } from "@ceramicnetwork/http-client";
import { getAuthenticatedDID } from '@composexp/did-utils'
import { PointsWriter } from '@composexp/points'
import { fromString } from 'uint8arrays';

export interface PointData {
  recipient: string;
  model: string;
  context: string;
  amt: number;
}

export async function getContext() {

  // CERAMIC SPECIFIC PART HERE
  const CERAMIC_URL = process.env.CERAMIC_URL || "";
  const CERAMIC_PRIVATE_KEY = process.env.CERAMIC_PRIVATE_KEY || "";
  const key = fromString(CERAMIC_PRIVATE_KEY, "base16");

  console.log("Using ceramic node at " + CERAMIC_URL)
  const ceramic = new CeramicClient(CERAMIC_URL);
  ceramic.did = await getAuthenticatedDID(key);
  // CERAMIC SPECIFIC CODE HERE

  return ceramic;
};

export class Publisher {
  private modelWriters = new Map<string, any>();

  constructor(private ceramic: any) {}

  async publishPoints(pointData: PointData) {
    let writer = this.modelWriters.get(pointData.model);
    if (!writer) {
      writer = new PointsWriter({ceramic:this.ceramic, allocationModelID:pointData.model});
      this.modelWriters.set(pointData.model, writer);
    }
    await writer.publish(pointData);
  }
}


