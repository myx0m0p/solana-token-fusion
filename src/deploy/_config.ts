import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, dateTime, percentAmount, sol, some } from '@metaplex-foundation/umi';
import {
  ConfigLine,
  DefaultGuardSetArgs,
  GuardGroupArgs,
} from '@metaplex-foundation/mpl-candy-machine';

import { METAPLEX_DEFAULT_RULESET } from '../utils/umi';
import { getMerkleRootByGroup } from '../mint/helpers';
import { ClusterType } from '../utils/cluster';

export const SPL_TOKEN_METADATA = {
  name: 'sinDAO',
  symbol: 'SIN',
  uri: 'https://nftstorage.link/ipfs/bafkreih6vbeori6putwetw2jlt56jrn2goox44fuxwldvv7ppgrjcovmqm',
  img: 'https://nftstorage.link/ipfs/bafkreiewhswfoszfwomy23fqhvxlmmbld2ntmb6u3jsjbrda64aloyblhi',
  decimals: 6n,
  mint: true,
  mintAmount: 6_666_666_666_666n,
};

export const NFT_STORAGE_CID =
  'https://nftstorage.link/ipfs/bafybeict4d76npw5jkgmjkffprtqqe56hwyh2m6qajag6yht3ophw2g3t4';

export const PROD_NFT_STORAGE_CID = 'https://meta.sindao.org/metadata'; // !!!TODO set to prod

export const NFT_NAME_PREFIX = 'Sinner #';
export const NFT_AVAILABLE = 666n;

export const NFT_COLLECTION_SETTINGS = {
  tokenStandard: TokenStandard.ProgrammableNonFungible,
  sellerFeeBasisPoints: percentAmount(0.99, 2),
  name: 'sinDAO',
  symbol: 'SINNER',
  uri: 'https://nftstorage.link/ipfs/bafkreie5sffqzh5m4gabkkg55xwlvgayucb2lbmdnsww3dylbh5xc5nzmu',
  ruleSet: METAPLEX_DEFAULT_RULESET,
  itemsAvailable: NFT_AVAILABLE,
  configLineSettings: some({
    prefixName: `${NFT_NAME_PREFIX}$ID+1$`,
    nameLength: 0,
    prefixUri: `${PROD_NFT_STORAGE_CID}/$ID+1$`, // !!!TODO set to PROD_NFT_STORAGE_CID for production
    uriLength: 0,
    isSequential: false,
  }),
  guards: {
    botTax: some({ lamports: sol(0.001), lastInstruction: true }),
    startDate: some({ date: dateTime('2024-01-29T18:00:00Z') }),
    endDate: some({ date: dateTime('2024-02-01T12:06:06Z') }),
  },
};

export const ITEMS_PER_TX = 66;

export const getLineSettings = (amount: number, batch = ITEMS_PER_TX): Array<Array<ConfigLine>> => {
  const fullArray = new Array<ConfigLine>(amount).fill({ name: '', uri: '' });

  const result: Array<Array<ConfigLine>> = [];

  for (let i = 0; i < fullArray.length; i += batch) {
    result.push(fullArray.slice(i, i + batch));
  }

  return result;
};

export const getCandyGuardGroups = (
  treasure: PublicKey,
  cluster: ClusterType = 'localnet'
): GuardGroupArgs<DefaultGuardSetArgs>[] => {
  return [
    {
      label: 'FR',
      guards: {
        mintLimit: some({ id: 1, limit: 1 }), // !!!TODO Change in prod to 1
        allowList: some({ merkleRoot: getMerkleRootByGroup('FR', cluster) }),
        allocation: some({ id: 3, limit: 333 }), // !!!TODO Change in prod to 333
      },
    },
    {
      label: 'WL',
      guards: {
        solPayment: some({
          lamports: sol(0.0666),
          destination: treasure,
        }),
        mintLimit: some({ id: 2, limit: 1 }), // !!!TODO Change in prod to 1
        allowList: some({ merkleRoot: getMerkleRootByGroup('WL', cluster) }),
      },
    },
  ];
};
