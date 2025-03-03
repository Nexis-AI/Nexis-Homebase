import useSWR from 'swr';

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export const useBalances = (address: string, chainId: string) => {
  return useSWR(
    address ? `/api/moralis/balances?address=${address}&chain=${chainId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000 // 1 minute
    }
  );
};
