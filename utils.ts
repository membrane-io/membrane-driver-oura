export function createHandler(
  endpoint: string,
  fetchFn: <T>(path: string) => Promise<T>
) {
  return ({ startDate, endDate, nextToken }) => {
    const queryString = generateQueryString({ startDate, endDate, nextToken });
    return fetchFn(`/${endpoint}${queryString}`);
  };
}

function generateQueryString({ startDate, endDate, nextToken }): string {
  let queryString = "?";

  if (startDate) queryString += `start_date=${startDate}&`;
  if (endDate) queryString += `end_date=${endDate}&`;
  if (nextToken) queryString += `next=${nextToken}&`;

  return queryString;
}
