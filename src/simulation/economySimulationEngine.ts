/**
 * GENESIS — Intelligent City Economy, Resource Management & District Development Engine
 *
 * Centralized, deterministic simulation engine that computes real-time:
 * 1. City Fiscal Flows (Income, Taxes, Maintenance, Infrastructure Upkeep, Net Cash Flow)
 * 2. Resource & Utility Accounting (Electricity MW, Water, Food, Materials, Workforce, Environment)
 * 3. District Development & Specialization Metrics
 * 4. Zoning Demands (Housing, Commercial, Industrial, Healthcare, Education)
 * 5. Intelligent City Alerts & Actionable Advisory
 */

import {
  PlacedBuilding,
  BuildingCatalogItem,
  ResourceState,
  ResourceRates,
  District,
} from '../types/game';

// ================= TYPES & INTERFACES =================

export interface CityEconomySummary {
  // Revenues (Cr/day)
  populationIncomeTax: number;
  commercialTaxYield: number;
  industrialOutputRevenue: number;
  interColonyTradeSurplus: number;
  totalDailyRevenue: number;
  totalAnnualRevenueBillion: number;

  // Expenditures (Cr/day)
  buildingMaintenanceTotal: number;
  infrastructureUpkeepTotal: number;
  publicServicesSubsidies: number;
  totalDailyExpenditure: number;
  totalAnnualExpenditureBillion: number;

  // Fiscal Balance
  netDailyCashFlow: number;
  netAnnualCashFlowBillion: number;
  fiscalHealth: 'Surplus' | 'Balanced' | 'Deficit';
  taxRatePercent: number;
}

export interface ResourceAccounting {
  // Electricity (MW)
  energyProducedMW: number;
  energyConsumedMW: number;
  energyNetMW: number;
  energyGridStressPercent: number; // (consumed / produced) * 100

  // Water (kL/day)
  waterProduced: number;
  waterConsumed: number;
  waterNet: number;
  waterGridStressPercent: number;

  // Food Biomass (Rations/day)
  foodProduced: number;
  foodConsumed: number;
  foodNet: number;

  // Construction Materials (Tons/day)
  materialsProduced: number;
  materialsConsumed: number;
  materialsNet: number;

  // Workforce & Employment
  totalPopulation: number;
  workingAgePopulation: number;
  employedWorkforce: number;
  unemployedWorkforce: number;
  totalJobsCapacity: number;
  employmentRatePercent: number;
  unemploymentRatePercent: number;

  // Ecology & Waste
  wasteGeneratedDaily: number;
  wasteAbsorbedDaily: number;
  netPollutionDelta: number;
  environmentalIndex: number;
}

export interface DistrictMetricSummary {
  districtId: string;
  name: string;
  category: string;
  tier: number; // 1 to 5
  buildingCount: number;
  activeBuildingCount: number;
  population: number;
  housingCapacity: number;
  jobsCapacity: number;
  jobsEmployed: number;
  dailyRevenueYield: number;
  dailyMaintenanceDraw: number;
  energyDemandMW: number;
  waterDemand: number;
  developmentScore: number; // 0 to 100
  efficiencyScore: number;  // 0 to 100
  specialization: string;
}

export interface CityDemands {
  residentialDemand: number;  // 0 to 100% (High = housing shortage)
  commercialDemand: number;   // 0 to 100%
  industrialDemand: number;   // 0 to 100%
  healthcareDemand: number;   // 0 to 100%
  educationDemand: number;    // 0 to 100%
  energyDemand: number;       // 0 to 100%
  waterDemand: number;        // 0 to 100%
}

export interface CityAlert {
  id: string;
  type:
    | 'energy_deficit'
    | 'water_shortage'
    | 'food_deficit'
    | 'fiscal_deficit'
    | 'housing_crisis'
    | 'healthcare_strain'
    | 'high_unemployment'
    | 'environmental_warning';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metricLabel: string;
  metricValue: string;
  recommendedAction: string;
}

export interface CitySimulationReport {
  economy: CityEconomySummary;
  resources: ResourceAccounting;
  districts: DistrictMetricSummary[];
  demands: CityDemands;
  alerts: CityAlert[];
  hasCriticalPowerDeficit: boolean;
  hasWaterShortage: boolean;
  isProsperous: boolean;
}

// ================= SIMULATION ENGINE CORE CALCULATOR =================

/**
 * Calculates a complete, mathematically coherent snapshot of the city's
 * real economic, resource, and district development status.
 */
export function calculateCitySimulation(
  placedBuildings: PlacedBuilding[],
  catalog: BuildingCatalogItem[],
  resources: ResourceState,
  districts: District[],
  taxRate: number
): CitySimulationReport {
  // Map catalog for fast O(1) attribute lookup
  const catalogMap = new Map<string, BuildingCatalogItem>();
  catalog.forEach((item) => catalogMap.set(item.id, item));

  // 1. Aggregators for building-level metrics
  let totalMaintenance = 0;
  let totalEnergyGenMW = 0;
  let totalEnergyConMW = 0;
  let totalWaterGen = 0;
  let totalWaterCon = 0;
  let totalFoodGen = 0;
  let totalMaterialsGen = 0;
  let totalMaterialsCon = 0;
  let totalHousingCap = 0;
  let totalClinicCap = 0;
  let totalAcademyCap = 0;
  let totalJobsCap = 0;
  let totalJobsFilled = 0;
  let totalCommercialOutput = 0;

  // District bucket maps
  const distBuildings = new Map<string, PlacedBuilding[]>();
  districts.forEach((d) => distBuildings.set(d.id, []));

  placedBuildings.forEach((b) => {
    const item = catalogMap.get(b.catalogId);
    const cat = b.category;
    const lvl = b.level || 1;
    const effFactor = (b.efficiency || 90) / 100;
    const isOffline = b.status === 'offline';
    const isConstructing = b.status === 'constructing';
    const isUpgrading = b.status === 'upgrading';
    const isActive = b.status === 'active';

    // Store in district bucket
    if (b.districtId && distBuildings.has(b.districtId)) {
      distBuildings.get(b.districtId)!.push(b);
    }

    // Base properties from catalog
    const baseMaint = item?.maintenanceCost ?? 15;
    const baseEnergyReq = item?.energyReq ?? 10;
    const baseWaterReq = item?.waterReq ?? 10;
    const basePopCap = item?.populationCapacity ?? 0;
    const baseWorkerReq = item?.workerReq ?? 20;
    const baseProdAmt = item?.productionAmount ?? 0;
    const prodType = item?.productionType;

    // A. Building Maintenance Calculations
    let bMaint = 0;
    if (isOffline) {
      bMaint = Math.round(baseMaint * 0.2); // Standby security maintenance
    } else if (isConstructing) {
      bMaint = Math.round(baseMaint * 0.15); // Site perimeter upkeep
    } else if (isUpgrading) {
      bMaint = Math.round(baseMaint * (1 + (lvl - 1) * 0.35) * 1.25); // Refit surcharge
    } else {
      bMaint = Math.round(baseMaint * (1 + (lvl - 1) * 0.35) * effFactor);
    }
    totalMaintenance += bMaint;

    // Skip utility and production calculations for fully offline buildings
    if (isOffline) return;

    // B. Utility & Energy Grid Calculations
    const utilityLvlMult = Math.pow(lvl, 0.75);
    if (baseEnergyReq < 0) {
      // Power generator (e.g. Solar, Wind, Fusion Plant)
      const gen = Math.abs(baseEnergyReq) * (1 + (lvl - 1) * 0.45) * effFactor;
      totalEnergyGenMW += gen;
    } else {
      // Energy consumer
      const con = baseEnergyReq * utilityLvlMult * (isConstructing ? 0.25 : 1.0);
      totalEnergyConMW += con;
    }

    // Water calculations
    if (cat === 'environment' && (b.catalogId.includes('water') || b.name.includes('Water'))) {
      totalWaterGen += 160 * utilityLvlMult * effFactor;
    } else {
      totalWaterCon += baseWaterReq * utilityLvlMult * (isConstructing ? 0.2 : 1.0);
    }

    // C. Production Accounting
    if (isActive && prodType && baseProdAmt > 0) {
      const prodYield = baseProdAmt * (1 + (lvl - 1) * 0.4) * effFactor;
      if (prodType === 'food') {
        totalFoodGen += prodYield;
      } else if (prodType === 'materials') {
        totalMaterialsGen += prodYield;
      }
    }

    // Construction material consumption
    if (isConstructing) {
      totalMaterialsCon += 14; // active construction frame draw
    }
    if (isUpgrading) {
      totalMaterialsCon += 18; // structural refit draw
    }

    // D. Capacities & Workforce
    if (isActive || isUpgrading) {
      totalHousingCap += basePopCap * (1 + (lvl - 1) * 0.4);
      totalJobsCap += baseWorkerReq * lvl;
      totalJobsFilled += b.workersAssigned || Math.round(baseWorkerReq * lvl * 0.95);

      if (cat === 'commercial') {
        totalCommercialOutput += 85 * lvl * effFactor;
      } else if (cat === 'healthcare') {
        totalClinicCap += 280 * lvl;
      } else if (cat === 'education') {
        totalAcademyCap += 240 * lvl;
      }
    }
  });

  // 2. Resource Management Accounting (Water, Food, Materials, Workforce)
  const pop = resources.population || 1240000;
  const workingAgePop = Math.round(pop * 0.58);
  const employed = Math.min(workingAgePop, totalJobsFilled);
  const unemployed = Math.max(0, workingAgePop - employed);
  const employmentRate = workingAgePop > 0 ? (employed / workingAgePop) * 100 : 90;
  const unemploymentRate = 100 - employmentRate;

  // Population baseline resource draws
  const populationWaterDraw = Math.round((pop / 10000) * 1.8);
  const totalWaterConsumed = Math.round(totalWaterCon + populationWaterDraw);
  const totalWaterProduced = Math.max(80, Math.round(totalWaterGen + 120)); // baseline municipal aquifer + facilities

  const populationFoodDraw = Math.round((pop / 10000) * 1.4);
  const totalFoodConsumed = Math.round(populationFoodDraw);
  const totalFoodProduced = Math.max(40, Math.round(totalFoodGen));

  const totalMaterialsConsumed = Math.round(totalMaterialsCon + totalMaintenance * 0.25);
  const totalMaterialsProduced = Math.max(50, Math.round(totalMaterialsGen));

  const energyGridStress = totalEnergyGenMW > 0 ? (totalEnergyConMW / totalEnergyGenMW) * 100 : 100;
  const waterGridStress = totalWaterProduced > 0 ? (totalWaterConsumed / totalWaterProduced) * 100 : 100;

  // Waste & Environment
  const wasteGen = Math.round(pop * 0.0018 + totalMaterialsGen * 0.6);
  const wasteAbsorb = Math.round(totalHousingCap * 0.0012 + 450);
  const netPollution = wasteGen - wasteAbsorb;

  const resourceAccounting: ResourceAccounting = {
    energyProducedMW: Math.round(totalEnergyGenMW),
    energyConsumedMW: Math.round(totalEnergyConMW),
    energyNetMW: Math.round(totalEnergyGenMW - totalEnergyConMW),
    energyGridStressPercent: Math.round(energyGridStress),

    waterProduced: totalWaterProduced,
    waterConsumed: totalWaterConsumed,
    waterNet: totalWaterProduced - totalWaterConsumed,
    waterGridStressPercent: Math.round(waterGridStress),

    foodProduced: totalFoodProduced,
    foodConsumed: totalFoodConsumed,
    foodNet: totalFoodProduced - totalFoodConsumed,

    materialsProduced: totalMaterialsProduced,
    materialsConsumed: totalMaterialsConsumed,
    materialsNet: totalMaterialsProduced - totalMaterialsConsumed,

    totalPopulation: pop,
    workingAgePopulation: workingAgePop,
    employedWorkforce: employed,
    unemployedWorkforce: unemployed,
    totalJobsCapacity: totalJobsCap,
    employmentRatePercent: parseFloat(employmentRate.toFixed(1)),
    unemploymentRatePercent: parseFloat(unemploymentRate.toFixed(1)),

    wasteGeneratedDaily: wasteGen,
    wasteAbsorbedDaily: wasteAbsorb,
    netPollutionDelta: netPollution,
    environmentalIndex: resources.environmentalIndex || 88,
  };

  // 3. City Fiscal & Economy Engine
  const effectiveTaxRate = taxRate || 12;
  const baseWorkerWageCredits = 4.2;
  const popIncomeTax = Math.round(employed * baseWorkerWageCredits * (effectiveTaxRate / 100));
  const commTax = Math.round(totalCommercialOutput * 1.8 * (effectiveTaxRate / 100));
  const indRev = Math.round(totalMaterialsProduced * 2.2);
  const tradeSurplus = Math.round(
    Math.max(0, resourceAccounting.foodNet * 1.2) +
    Math.max(0, resourceAccounting.materialsNet * 1.8) +
    Math.max(0, resourceAccounting.energyNetMW * 2.5)
  );

  // Early-colony exploration stipend & charter grant ensures small settlements can accumulate capital for Citadel expansion
  const colonyStipend = pop < 35 ? Math.max(15, 42 - pop) : 0;
  const totalDailyRev = popIncomeTax + commTax + indRev + tradeSurplus + colonyStipend;

  // Expenditures: Infrastructure upkeep scales reasonably with actual settlement footprint rather than bankrupting small villages
  const infraUpkeep = Math.min(58, Math.max(4, placedBuildings.length * 3));
  const publicServices = Math.round(totalClinicCap * 0.12 + totalAcademyCap * 0.14);
  const totalDailyExp = totalMaintenance + infraUpkeep + publicServices;

  const netDailyCash = totalDailyRev - totalDailyExp;
  const netAnnualBillion = (netDailyCash * 365) / 1000000;

  const economySummary: CityEconomySummary = {
    populationIncomeTax: popIncomeTax,
    commercialTaxYield: commTax,
    industrialOutputRevenue: indRev,
    interColonyTradeSurplus: tradeSurplus,
    totalDailyRevenue: totalDailyRev,
    totalAnnualRevenueBillion: parseFloat(((totalDailyRev * 365) / 1000000).toFixed(2)),

    buildingMaintenanceTotal: totalMaintenance,
    infrastructureUpkeepTotal: infraUpkeep,
    publicServicesSubsidies: publicServices,
    totalDailyExpenditure: totalDailyExp,
    totalAnnualExpenditureBillion: parseFloat(((totalDailyExp * 365) / 1000000).toFixed(2)),

    netDailyCashFlow: netDailyCash,
    netAnnualCashFlowBillion: parseFloat(netAnnualBillion.toFixed(2)),
    fiscalHealth: netDailyCash > 40 ? 'Surplus' : netDailyCash >= -20 ? 'Balanced' : 'Deficit',
    taxRatePercent: effectiveTaxRate,
  };

  // 4. District Development System
  const districtSummaries: DistrictMetricSummary[] = districts.map((dist) => {
    const bList = distBuildings.get(dist.id) || [];
    const activeBList = bList.filter((b) => b.status === 'active');
    const totalDistLevel = bList.reduce((acc, b) => acc + (b.level || 1), 0);
    const avgLevel = bList.length > 0 ? totalDistLevel / bList.length : 1;
    const tier = Math.min(5, Math.max(1, Math.round(avgLevel)));

    let distEnergyDraw = 0;
    let distWaterDraw = 0;
    let distRevenue = 0;
    let distMaint = 0;
    let distHousing = 0;
    let distJobs = 0;
    let distEmployed = 0;

    bList.forEach((b) => {
      const item = catalogMap.get(b.catalogId);
      const lvl = b.level || 1;
      const eff = (b.efficiency || 90) / 100;
      distEnergyDraw += (item?.energyReq ?? 10) * Math.pow(lvl, 0.75);
      distWaterDraw += (item?.waterReq ?? 10) * Math.pow(lvl, 0.75);
      distMaint += (item?.maintenanceCost ?? 15) * lvl * eff;
      distHousing += (item?.populationCapacity ?? 0) * lvl;
      distJobs += (item?.workerReq ?? 20) * lvl;
      distEmployed += b.workersAssigned || Math.round((item?.workerReq ?? 20) * lvl * 0.9);
      if (b.category === 'commercial') distRevenue += 85 * lvl * eff;
      if (b.category === 'industrial') distRevenue += 110 * lvl * eff;
    });

    const devScore = Math.min(
      100,
      Math.round(bList.length * 12 + avgLevel * 14 + (dist.efficiency || 90) * 0.25)
    );

    return {
      districtId: dist.id,
      name: dist.name,
      category: dist.category,
      tier,
      buildingCount: bList.length,
      activeBuildingCount: activeBList.length,
      population: dist.population,
      housingCapacity: distHousing,
      jobsCapacity: distJobs,
      jobsEmployed: distEmployed,
      dailyRevenueYield: Math.round(distRevenue),
      dailyMaintenanceDraw: Math.round(distMaint),
      energyDemandMW: Math.round(distEnergyDraw),
      waterDemand: Math.round(distWaterDraw),
      developmentScore: devScore,
      efficiencyScore: dist.efficiency || 90,
      specialization: dist.specialization,
    };
  });

  // 5. Intelligent City Demands (Housing, Commercial, Industrial, Services)
  const housingOccupancy = totalHousingCap > 0 ? (pop / totalHousingCap) * 100 : 95;
  const resDemand = Math.min(100, Math.max(10, Math.round(housingOccupancy * 0.85)));

  const commDemand = Math.min(
    100,
    Math.max(15, Math.round((pop / 15000) * 1.2 - totalCommercialOutput * 0.15))
  );

  const indDemand = Math.min(
    100,
    Math.max(15, Math.round(100 - (resourceAccounting.materialsNet / 50) * 20))
  );

  const clinicUtilization = totalClinicCap > 0 ? (pop / (totalClinicCap * 1500)) * 100 : 80;
  const healthDemand = Math.min(100, Math.max(10, Math.round(clinicUtilization * 0.9)));

  const eduDemand = Math.min(100, Math.max(10, Math.round((workingAgePop / 10000) * 0.9)));
  const energyStressDemand = Math.min(100, Math.round(energyGridStress));
  const waterStressDemand = Math.min(100, Math.round(waterGridStress));

  const demands: CityDemands = {
    residentialDemand: resDemand,
    commercialDemand: commDemand,
    industrialDemand: indDemand,
    healthcareDemand: healthDemand,
    educationDemand: eduDemand,
    energyDemand: energyStressDemand,
    waterDemand: waterStressDemand,
  };

  // 6. Intelligent Alert System (Evaluates Actual Thresholds)
  const alerts: CityAlert[] = [];

  // A. Power Grid Check
  if (resourceAccounting.energyNetMW < 0) {
    alerts.push({
      id: 'alt-power-deficit',
      type: 'energy_deficit',
      severity: 'critical',
      title: 'CRITICAL: City-Wide Energy Deficit',
      message: `Power grid consumption (${resourceAccounting.energyConsumedMW} MW) exceeds generation capacity (${resourceAccounting.energyProducedMW} MW). Risk of civic brownouts.`,
      metricLabel: 'Grid Deficit',
      metricValue: `${resourceAccounting.energyNetMW} MW`,
      recommendedAction: 'Construct a Solar Concentration Array or upgrade Ridge Wind Turbines to restore stability.',
    });
  } else if (energyGridStress > 90) {
    alerts.push({
      id: 'alt-power-strain',
      type: 'energy_deficit',
      severity: 'warning',
      title: 'Power Grid High Utilization Strain',
      message: `Civic power consumption is operating at ${resourceAccounting.energyGridStressPercent}% of peak generation capacity.`,
      metricLabel: 'Reserve Margin',
      metricValue: `+${resourceAccounting.energyNetMW} MW`,
      recommendedAction: 'Commission additional power generation before approving further high-rise developments.',
    });
  }

  // B. Water Check
  if (resourceAccounting.waterNet < 0) {
    alerts.push({
      id: 'alt-water-shortage',
      type: 'water_shortage',
      severity: 'critical',
      title: 'CRITICAL: Municipal Water Shortage',
      message: `Water consumption (${resourceAccounting.waterConsumed} kL/d) exceeds replenishment capacity (${resourceAccounting.waterProduced} kL/d).`,
      metricLabel: 'Water Deficit',
      metricValue: `${resourceAccounting.waterNet} kL/day`,
      recommendedAction: 'Expand Municipal Water Tower capacity or construct a Water Treatment Facility.',
    });
  }

  // C. Fiscal Deficit Check
  if (economySummary.netDailyCashFlow < -15) {
    alerts.push({
      id: 'alt-fiscal-deficit',
      type: 'fiscal_deficit',
      severity: 'warning',
      title: 'Fiscal Deficit: Daily Expenditures Exceed Revenues',
      message: `Daily municipal spending (${economySummary.totalDailyExpenditure} Cr) outpaces revenue yield (${economySummary.totalDailyRevenue} Cr).`,
      metricLabel: 'Net Cash Flow',
      metricValue: `${economySummary.netDailyCashFlow} Cr/day`,
      recommendedAction: 'Adjust the municipal tax rate slider or deactivate redundant facilities.',
    });
  }

  // D. Housing Shortage Check
  if (housingOccupancy > 98) {
    alerts.push({
      id: 'alt-housing-shortage',
      type: 'housing_crisis',
      severity: 'warning',
      title: 'Housing Capacity Strained',
      message: `Urban population is nearing residential capacity (${totalHousingCap.toLocaleString()} residents).`,
      metricLabel: 'Occupancy',
      metricValue: `${Math.round(housingOccupancy)}%`,
      recommendedAction: 'Zoning approval needed: construct new Modular Habitat Blocks or upgrade Arcology Spires.',
    });
  }

  // E. Healthcare Strain Check
  if (resources.health && resources.health < 65) {
    alerts.push({
      id: 'alt-healthcare-strain',
      type: 'healthcare_strain',
      severity: 'warning',
      title: 'Public Health Index Degradation',
      message: 'Citizen biological diagnostics indicate elevated clinical demand.',
      metricLabel: 'Health Index',
      metricValue: `${resources.health}/100`,
      recommendedAction: 'Upgrade Oasis Cellular Care Clinic to Level 3 to expand medical coverage.',
    });
  }

  // F. Prosperity Notice
  if (economySummary.netDailyCashFlow > 50 && resourceAccounting.energyNetMW > 10) {
    alerts.push({
      id: 'alt-economic-boom',
      type: 'fiscal_deficit',
      severity: 'info',
      title: 'Civic Economic Prosperity Horizon',
      message: `All sectors operating with robust fiscal surplus (+${economySummary.netDailyCashFlow} Cr/day) and stable resource buffers.`,
      metricLabel: 'Daily Surplus',
      metricValue: `+${economySummary.netDailyCashFlow} Cr`,
      recommendedAction: 'Reinvest capital into high-tier research, monuments, or colonnade upgrades.',
    });
  }

  return {
    economy: economySummary,
    resources: resourceAccounting,
    districts: districtSummaries,
    demands,
    alerts,
    hasCriticalPowerDeficit: resourceAccounting.energyNetMW < 0,
    hasWaterShortage: resourceAccounting.waterNet < 0,
    isProsperous: economySummary.netDailyCashFlow > 45,
  };
}

