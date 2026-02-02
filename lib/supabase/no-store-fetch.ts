type Fetch = typeof fetch

export function createNoStoreFetch(baseFetch: Fetch = fetch): Fetch {
  const noStoreFetch = (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    type RequestInitWithNext = Parameters<Fetch>[1] & {
      next?: { revalidate?: number | false; tags?: string[] }
    }

    const initWithNext = init as RequestInitWithNext | undefined
    const mergedInit = {
      ...(init ?? {}),
      cache: "no-store",
      next: { ...(initWithNext?.next ?? {}), revalidate: 0 },
    } satisfies RequestInitWithNext

    return baseFetch(input, mergedInit)
  }

  return noStoreFetch as Fetch
}
