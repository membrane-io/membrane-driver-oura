/**
 * Driver for Oura
 *
 * See the [Oura V2 API docs](https://cloud.ouraring.com/v2/docs) for more information.
 */

import { root, state, resolvers } from "membrane";

export interface State {
  personalAccessToken?: string;
}

/**
 * HELPERS
 */

const OURA_V2_API_URL = "https://api.ouraring.com/v2/usercollection";

const api = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${OURA_V2_API_URL}${path}`, {
    method: "GET", // all Oura V2 API requests are GET, except webhooks
    headers: { Authorization: `Bearer ${state.personalAccessToken}` },
  });

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

// TODO: clean up and/or extract helper(s)
// Nits - FIXME:
// 1. Pagination sorts in chronological order on each page
// 2. Pagination includes bordering items on prev/next page
const paginate = (args: {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) => {
  const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
  let { startDate, endDate, page, pageSize } = args;
  let nextArgs;

  page = Math.max(page ?? 1, 1);
  pageSize = Math.min(10, pageSize ?? 7); // TODO: bound by actual Oura API limit?

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date();

  if (end.getTime() - start.getTime() > pageSize * ONE_DAY_IN_MS) {
    end.setTime(end.getTime() - (page - 1) * pageSize * ONE_DAY_IN_MS);
    start.setTime(end.getTime() - pageSize * ONE_DAY_IN_MS);

    nextArgs = {
      startDate,
      endDate,
      page: page + 1,
      pageSize,
    };
  } else {
    if (!startDate) {
      start.setTime(end.getTime() - (pageSize - 1) * ONE_DAY_IN_MS);
    }
    nextArgs = null;
  }

  const searchParams = new URLSearchParams();
  searchParams.append("start_date", start.toISOString().split("T")[0]);
  searchParams.append("end_date", end.toISOString().split("T")[0]);

  return {
    params: searchParams.toString(),
    nextArgs,
  };
};

/**
 * FIELDS, ACTIONS
 */

export const Root: resolvers.Root = {
  status() {
    return !state.personalAccessToken
      ? "[Add Personal Access Token](:configure)"
      : "Ready";
  },

  // To set up a personal access token: https://cloud.ouraring.com/personal-access-tokens/new
  async configure({ personalAccessToken }) {
    state.personalAccessToken = personalAccessToken;
    root.statusChanged.$emit();
  },

  dailySleep: () => ({}),
  dailyActivity: () => ({}),
  dailyReadiness: () => ({}),
  dailyStress: () => ({}),
};

export const DailySleep: resolvers.DailySleep = {
  gref: (_, { obj }) => root.dailySleep.one({ id: obj.id }),
};

export const DailySleepCollection: resolvers.DailySleepCollection = {
  one: ({ id }) => api(`/daily_sleep/${id}`),

  page: async (args, { self }) => {
    const { params, nextArgs } = paginate(args);

    const { data } = await api<{ data: resolvers.DailySleep }>(
      `/daily_sleep?${params}`
    );

    return {
      items: data,
      next: nextArgs ? self.page(nextArgs) : null,
    };
  },
};

export const DailyActivity: resolvers.DailyActivity = {
  gref: (_, { obj }) => root.dailyActivity.one({ id: obj.id }),
};

export const DailyActivityCollection: resolvers.DailyActivityCollection = {
  one: ({ id }) => api(`/daily_activity/${id}`),

  page: async (args, { self }) => {
    const { params, nextArgs } = paginate(args);

    const { data } = await api<{ data: resolvers.DailyActivity }>(
      `/daily_activity?${params}`
    );

    return {
      items: data,
      next: nextArgs ? self.page(nextArgs) : null,
    };
  },
};

export const DailyReadiness: resolvers.DailyReadiness = {
  gref: (_, { obj }) => root.dailyReadiness.one({ id: obj.id }),
};

export const DailyReadinessCollection: resolvers.DailyReadinessCollection = {
  one: ({ id }) => api(`/daily_readiness/${id}`),

  page: async (args, { self }) => {
    const { params, nextArgs } = paginate(args);

    const { data } = await api<{ data: resolvers.DailyReadiness }>(
      `/daily_readiness?${params}`
    );

    return {
      items: data,
      next: nextArgs ? self.page(nextArgs) : null,
    };
  },
};

export const DailyStress: resolvers.DailyStress = {
  gref: (_, { obj }) => root.dailyStress.one({ id: obj.id }),
};

export const DailyStressCollection: resolvers.DailyStressCollection = {
  one: ({ id }) => api(`/daily_stress/${id}`),

  page: async (args, { self }) => {
    const { params, nextArgs } = paginate(args);

    const { data } = await api<{ data: resolvers.DailyStress }>(
      `/daily_stress?${params}`
    );

    return {
      items: data,
      next: nextArgs ? self.page(nextArgs) : null,
    };
  },
};
