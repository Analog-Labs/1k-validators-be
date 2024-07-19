import { logger, queries } from "@1kv/common";

const label = { label: "Gateway" };

export const getCandidateData = async (candidate: any): Promise<any> => {
  const [metadata, score, nominations, location, rewards] = await Promise.all([
    queries.getChainMetadata(),
    queries.getLatestValidatorScore(candidate.stash),
    queries.getLatestNominatorStake(candidate.stash),
    queries.getCandidateLocation(candidate.slotId),
    queries.getTotalValidatorRewards(candidate.stash),
  ]);

  const denom = Math.pow(10, metadata.decimals);

  return {
    slotId: candidate.slotId,
    kyc: candidate.kyc,
    discoveredAt: candidate.discoveredAt,
    nominatedAt: candidate.nominatedAt,
    offlineSince: candidate.offlineSince,
    offlineAccumulated: candidate.offlineAccumulated,
    rank: candidate.rank || 0,
    faults: candidate.faults,
    invalidityReasons: candidate.invalidityReasons,
    unclaimedEras: candidate.unclaimedEras,
    inclusion: candidate.inclusion,
    name: candidate.name,
    stash: candidate.stash,
    kusamaStash: candidate.kusamaStash,
    commission: candidate.commission,
    identity: candidate.identity,
    active: candidate.active,
    bonded: candidate.bonded / denom,
    valid: candidate.valid,
    validity: candidate.invalidity,
    score: score,
    total: score && score.total ? score.total : 0,
    location: location?.city,
    provider: location?.provider,
    cpu: location?.cpu,
    memory: location?.memory,
    coreCount: location?.coreCount,
    vm: location?.vm,
    region: location?.region,
    country: location?.country,
    matrix: candidate.matrix,
    version: candidate.version,
    implementation: candidate.implementation,
    queuedKeys: candidate.queuedKeys,
    nextKeys: candidate.nextKeys,
    rewardDestination: candidate.rewardDestination,
    nominations: {
      totalStake: nominations?.totalStake,
      inactiveStake: nominations?.inactiveStake,
      activeNominators: nominations?.activeNominators?.length,
      inactiveNominators: nominations?.inactiveNominators?.length,
    },
    rewards: rewards,
  };
};

export const getCandidatesWithRewards = async (
  stash?: string,
  page?: string,
  limit?: string,
): Promise<any> => {
  const allCandidates = await queries.getAllCandidatesWithPagination(
    stash as string,
    Number(page) || 1,
    Number(limit) || 0,
  );
  const candidatesWithAdditionalFields = await Promise.all(
    allCandidates.candidates.map(async (candidate) => {
      return await getCandidateData(candidate);
    }),
  );

  const sortedCandidates = candidatesWithAdditionalFields.sort((a, b) => {
    return b.total - a.total;
  });

  return Number(limit)
    ? { candidates: sortedCandidates, totalCount: allCandidates.totalCount }
    : sortedCandidates;
};

export const getCandidatesSearchSuggestion = async (
  searchTerm: string,
): Promise<any> => {
  return await queries.getCandidateSearchSuggestion(searchTerm);
};