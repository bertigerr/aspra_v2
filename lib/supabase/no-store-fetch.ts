type Fetch = typeof fetch

export function createNoStoreFetch(baseFetch: Fetch = fetch): Fetch {
  const noStoreFetch = (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const mergedInit = {
      ...(init as Record<string, unknown> | undefined),
      cache: "no-store",
      next: { ...((init as any)?.next ?? {}), revalidate: 0 },
    } satisfies RequestInit & { next?: unknown }

    return baseFetch(input, mergedInit)
  }

  return noStoreFetch as Fetch
}
