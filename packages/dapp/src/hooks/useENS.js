import { useWeb3Context } from 'contexts/Web3Context';
import { ethers } from 'ethers';
import { logError } from 'lib/helpers';
import { getEthersProvider } from 'lib/providers';
import { useEffect, useState } from 'react';

export function useENS(address) {
  const [ensName, setENSName] = useState('');
  const { providerChainId } = useWeb3Context();

  useEffect(() => {
    async function resolveENS() {
      try {
        if (ethers.utils.isAddress(address)) {
          const provider = await getEthersProvider(providerChainId);
          const name = await provider.lookupAddress(address);
          if (name) setENSName(name);
        }
      } catch (err) {
        logError({ ensError: err });
      }
    }
    resolveENS();
  }, [address, providerChainId]);

  return { ensName };
}
