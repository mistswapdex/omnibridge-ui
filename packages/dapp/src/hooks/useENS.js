import { useWeb3Context } from 'contexts/Web3Context';
import { ethers } from 'ethers';
import { logError } from 'lib/helpers';
import { getEthersProvider } from 'lib/providers';
import { useEffect, useState } from 'react';

const extraEnsAddressMap = {
  10000: '0xCfb86556760d03942EBf1ba88a9870e67D77b627',
  10001: '0x32f1FBE59D771bdB7FB247FE97A635f50659202b',
};

export function useENS(address) {
  const [ensName, setENSName] = useState('');
  const { providerChainId } = useWeb3Context();

  useEffect(() => {
    async function resolveENS() {
      try {
        if (ethers.utils.isAddress(address)) {
          const provider = await getEthersProvider(providerChainId);
          const network = await provider.getNetwork();
          const ensAddress = extraEnsAddressMap[providerChainId];
          if (!network?.ensAddress && ensAddress) {
            provider._network.ensAddress = ensAddress;
          }

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
