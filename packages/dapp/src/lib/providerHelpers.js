import { ethers } from 'ethers';
import memoize from 'fast-memoize';
import { LOCAL_STORAGE_KEYS } from 'lib/constants';
import {
  getNetworkEnsAddress,
  getNetworkLabel,
  getNetworkName,
  getRPCUrl,
  logError,
} from 'lib/helpers';

const {
  MAINNET_RPC_URL,
  RINKEBY_RPC_URL,
  KOVAN_RPC_URL,
  BSC_RPC_URL,
  SOKOL_RPC_URL,
  POA_RPC_URL,
  XDAI_RPC_URL,
  SMARTBCH_RPC_URL,
  AMBER_RPC_URL,
} = LOCAL_STORAGE_KEYS;

const LOCAL_STORAGE_KEYS_MAP = {
  1: MAINNET_RPC_URL,
  4: RINKEBY_RPC_URL,
  42: KOVAN_RPC_URL,
  56: BSC_RPC_URL,
  77: SOKOL_RPC_URL,
  99: POA_RPC_URL,
  100: XDAI_RPC_URL,
  10000: SMARTBCH_RPC_URL,
  10001: AMBER_RPC_URL,
};

const NETWORK_TIMEOUT = 1000;

const memoized = memoize((url, chainId) => {
  const provider = new ethers.providers.StaticJsonRpcProvider(
    url,
    getNetworkEnsAddress(chainId) && {
      ensAddress: getNetworkEnsAddress(chainId),
      chainId: Number(chainId),
      name: getNetworkName(chainId),
    },
  );
  return provider;
});

const checkRPCHealth = async (url, chainId) => {
  if (!url) return null;
  const tempProvider = memoized(url, chainId);
  if (!tempProvider) return null;
  try {
    await Promise.race([
      // eslint-disable-next-line no-underscore-dangle
      tempProvider._networkPromise,
      setTimeout(
        () => Promise.reject(new Error('Network timeout')).catch(() => null),
        NETWORK_TIMEOUT,
      ),
    ]);
    return tempProvider;
  } catch (err) {
    logError({ providerSetError: err.message });
    return null;
  }
};

export const getValidEthersProvider = async chainId => {
  const label = getNetworkLabel(chainId).toUpperCase();
  const sessionStorageKey = `HEALTHY-RPC-URL-${label}`;

  const sessionRPCUrl = window.sessionStorage.getItem(sessionStorageKey);
  const localRPCUrl = window.localStorage.getItem(
    LOCAL_STORAGE_KEYS_MAP[chainId],
  );

  const rpcURLs = getRPCUrl(chainId, true) || [];

  const provider =
    (await checkRPCHealth(localRPCUrl, chainId)) ??
    (await checkRPCHealth(sessionRPCUrl, chainId)) ??
    (
      await Promise.all(rpcURLs.map(url => checkRPCHealth(url, chainId)))
    ).filter(p => !!p)[0];
  if (provider?.connection?.url) {
    window.sessionStorage.setItem(sessionStorageKey, provider.connection.url);
  }

  return provider ?? null;
};
