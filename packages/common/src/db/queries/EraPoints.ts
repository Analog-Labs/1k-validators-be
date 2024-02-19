// Create new Era Points records
import { EraPointsModel, TotalEraPointsModel } from "../models";
import { getIdentityAddresses } from "./Candidate";

export const setEraPoints = async (
  era: number,
  points: number,
  address: string,
): Promise<any> => {
  const data = await EraPointsModel.findOne({
    address: address,
    era: era,
  }).lean();

  // If the era points already exist and are the same as before, return
  if (!!data && data.eraPoints == points) return;

  // If they don't exist
  if (!data) {
    const eraPoints = new EraPointsModel({
      address: address,
      era: era,
      eraPoints: points,
    });

    return eraPoints.save();
  }

  await EraPointsModel.findOneAndUpdate(
    {
      address: address,
      era: era,
    },
    {
      eraPoints: points,
    },
  ).exec();
};

export const getEraPoints = async (
  era: number,
  address: string,
): Promise<any> => {
  return EraPointsModel.findOne({
    address: address,
    era: era,
  }).lean();
};

// Creates new record of era points for all validators for an era
export const setTotalEraPoints = async (
  era: number,
  total: number,
  validators: { address: string; eraPoints: number }[],
): Promise<any> => {
  for (const validator of validators) {
    // Try setting the era points
    await setEraPoints(era, validator.eraPoints, validator.address);
  }

  // Check if a record already exists
  const data = await TotalEraPointsModel.findOne({
    era: era,
  }).lean();

  // If it exists and the total era points are the same, return
  if (!!data && data.totalEraPoints == total && data.median) return;

  const points = [];
  for (const v of validators) {
    points.push(v.eraPoints);
  }

  // Find median, max, and average era points
  const getAverage = (list) =>
    list.reduce((prev, curr) => prev + curr) / list.length;

  // Calculate Median
  const getMedian = (array) => {
    // Check If Data Exists
    if (array.length >= 1) {
      // Sort Array
      array = array.sort((a, b) => {
        return a - b;
      });

      // Array Length: Even
      if (array.length % 2 === 0) {
        // Average Of Two Middle Numbers
        return (array[array.length / 2 - 1] + array[array.length / 2]) / 2;
      }
      // Array Length: Odd
      else {
        // Middle Number
        return array[(array.length - 1) / 2];
      }
    } else {
      // Error
      console.error("Error: Empty Array (calculateMedian)");
    }
  };

  const max = Math.max(...points);
  const min = Math.min(...points);
  const avg = getAverage(points);
  const median = getMedian(points);

  // If it doesn't exist, create it
  if (!data) {
    const totalEraPoints = new TotalEraPointsModel({
      era: era,
      totalEraPoints: total,
      validatorsEraPoints: validators,
      median: median,
      average: avg,
      max: max,
      min: min,
    });

    return totalEraPoints.save();
  }

  // It exists, update it
  await TotalEraPointsModel.findOneAndUpdate(
    {
      era: era,
    },
    {
      totalEraPoints: total,
      validatorsEraPoints: validators,
      median: median,
      average: avg,
      max: max,
      min: min,
    },
  ).exec();
};

export const getTotalEraPoints = async (era: number): Promise<any> => {
  return TotalEraPointsModel.findOne({
    era: era,
  }).lean();
};

export const getLastTotalEraPoints = async (): Promise<any> => {
  const eraPoints = await TotalEraPointsModel.find({})
    .lean()
    .sort("-era")
    .limit(1);
  return eraPoints;
};

export const getSpanEraPoints = async (
  address: string,
  currentEra: number,
): Promise<any> => {
  return await EraPointsModel.find({
    address: address,
    era: { $gte: currentEra - 27 },
  })
    .lean()
    .exec();
};

// Gets the era points for a validator for the past 84 eras from a current era
export const getHistoryDepthEraPoints = async (
  address: string,
  currentEra: number,
): Promise<any> => {
  return await EraPointsModel.find({
    address: address,
    era: { $gte: currentEra - 83 },
  })
    .lean()
    .exec();
};

export const getHistoryDepthTotalEraPoints = async (
  currentEra: number,
): Promise<any> => {
  return await TotalEraPointsModel.find({
    era: { $gte: currentEra - 83 },
  })
    .lean()
    .exec();
};

export const getValidatorLastEraPoints = async (
  address: string,
): Promise<any> => {
  return await EraPointsModel.findOne({
    address: address,
  })
    .lean()
    .sort("-era")
    .limit(1)
    .exec();
};

// Gets the number of eras a validator has era points for
export const getValidatorEraPointsCount = async (
  address: string,
): Promise<number> => {
  const eras = await EraPointsModel.find({
    address: address,
  })
    .lean()
    .exec();
  return eras.length;
};

// Gets a list of the total count of era points for every identity that is a part of a validators super/sub identity
export const getIdentityValidatorEraPointsCount = async (
  address: string,
): Promise<{ address: string; eras: number }[]> => {
  const eraPointsList: { address: string; eras: number }[] = [];
  const identityAddresses: string[] = await getIdentityAddresses(address);
  for (const identityAddress of identityAddresses) {
    const eras = await getValidatorEraPointsCount(identityAddress);
    eraPointsList.push({ address: identityAddress, eras: eras });
  }
  return eraPointsList.sort((a, b) => b.eras - a.eras);
};

// For an identity, gets the identity with the most era points
export const getIdentityValidatorEraPointsCountMax = async (
  address: string,
): Promise<number> => {
  const identityEras: { address: string; eras: number }[] =
    await getIdentityValidatorEraPointsCount(address);
  const maxEras: number = Math.max(...identityEras.map((entry) => entry.eras));
  return maxEras || 0;
};
