/**
 * Driver for Oura
 *
 * See the [Oura V2 API docs](https://cloud.ouraring.com/v2/docs) for more information.
 */

import { root, state, resolvers } from "membrane";
import { createHandler } from "./utils";

export interface State {
  personalAccessToken?: string;
}

const OURA_V2_API_URL = "https://api.ouraring.com/v2/usercollection";

const api = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${OURA_V2_API_URL}${path}`, {
    method: "GET", // all Oura V2 API requests are GET, except webhooks
    headers: { Authorization: `Bearer ${state.personalAccessToken}` },
  });

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}: ${response.text()}`);
  }

  const { data } = await response.json();

  return data;
};

export const status: resolvers.Root["status"] = () => {
  return !state.personalAccessToken
    ? "[Add Personal Access Token](:configure)"
    : "Ready";
};

// To set up a personal access token: https://cloud.ouraring.com/personal-access-tokens/new
export const configure: resolvers.Root["configure"] = async ({
  personalAccessToken,
}) => {
  state.personalAccessToken = personalAccessToken;
  root.statusChanged.$emit();
};

export const daily: resolvers.Daily = {
  activity: createHandler("daily_activity", api),
  sleep: createHandler("daily_sleep", api),
  spo2: createHandler("daily_spo2", api),
  readiness: createHandler("daily_readiness", api),
  stress: createHandler("daily_stress", api),
};

// TODO: Implement the rest of the endpoints

// export const heartrate();

// export const personalInfo();

// export const tag();

// export const enhancedTag();

// export const workout();

// export const session();

// export const sleep();

// export const sleepTime();

// export const restModePeriod();

// export const ringConfiguration();
