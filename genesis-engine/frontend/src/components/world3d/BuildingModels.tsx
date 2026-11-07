import React from 'react';
import {
  SmallHouseModel,
  MediumResidentialModel,
  ApartmentBlockModel,
  HighRiseArcologyModel,
} from './buildings/ResidentialBuildings';
import {
  RetailShopModel,
  ShoppingComplexModel,
  OfficeBuildingModel,
  CommercialTowerModel,
} from './buildings/CommercialBuildings';
import {
  ClinicModel,
  HealthcareCenterModel,
  HospitalModel,
} from './buildings/HealthcareBuildings';
import {
  SchoolModel,
  CollegeModel,
  UniversityAcademyModel,
} from './buildings/EducationBuildings';
import {
  FactoryFoundryModel,
  ManufacturingUnitModel,
  LogisticsWarehouseModel,
  FusionPowerPlantModel,
  SolarArrayFieldModel,
  WindTurbineModel,
} from './buildings/IndustrialBuildings';
import {
  WaterTreatmentPlantModel,
  WaterStorageFacilityModel,
  ElectricalSubstationModel,
  SenateCitadelModel,
} from './buildings/InfrastructureBuildings';
import {
  BotanicalParkModel,
  CommunityGardenModel,
  RecreationCenterModel,
  AeroponicBioDomeModel,
  AlgaeSynthesisBasinModel,
} from './buildings/EnvironmentBuildings';
import { ObservatoryModel } from './buildings/ResearchBuildings';

// Backward-compatible named exports
export {
  WindTurbineModel,
  ObservatoryModel,
  HighRiseArcologyModel as ArcologySpireModel,
  MediumResidentialModel as ModularHabitatModel,
  CommercialTowerModel as CommercialExchangeModel,
  ShoppingComplexModel as CommercialPlazaModel,
  UniversityAcademyModel as AcademyModel,
  HospitalModel,
  FactoryFoundryModel as FactoryModel,
  LogisticsWarehouseModel as WarehouseModel,
  SolarArrayFieldModel as SolarArrayModel,
  FusionPowerPlantModel as FusionPlantModel,
  WaterTreatmentPlantModel as WaterTreatmentModel,
  BotanicalParkModel,
  AeroponicBioDomeModel as HydroponicDomeModel,
  AlgaeSynthesisBasinModel as AlgaeBasinModel,
  SenateCitadelModel as CitadelModel,
  SmallHouseModel,
  ApartmentBlockModel,
  RetailShopModel,
  OfficeBuildingModel,
  ClinicModel,
  HealthcareCenterModel,
  SchoolModel,
  CollegeModel,
  ManufacturingUnitModel,
  WaterStorageFacilityModel,
  ElectricalSubstationModel,
  CommunityGardenModel,
  RecreationCenterModel,
};

// Re-export Observatory model directly
export function ObservatoryMeshWrapper({
  isSelected,
  level,
}: {
  isSelected: boolean;
  level: number;
}) {
  return <ObservatoryModel isSelected={isSelected} level={level} />;
}

// Master Unified Building Model Router
export function MasterBuildingRouter({
  catalogId = '',
  category = 'residential',
  modelType = 'tower',
  level = 1,
  isSelected = false,
}: {
  catalogId?: string;
  category?: string;
  modelType?: string;
  level?: number;
  isSelected?: boolean;
}) {
  const cid = catalogId.toLowerCase();

  // 1. Specific catalog ID matching
  if (cid.includes('house')) {
    return <SmallHouseModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('modular')) {
    return <MediumResidentialModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('apartment')) {
    return <ApartmentBlockModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('shops')) {
    return <RetailShopModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('office')) {
    return <OfficeBuildingModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('clinic')) {
    return <ClinicModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('school')) {
    return <SchoolModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('college')) {
    return <CollegeModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('mfg')) {
    return <ManufacturingUnitModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('watertower')) {
    return <WaterStorageFacilityModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('substation')) {
    return <ElectricalSubstationModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('garden')) {
    return <CommunityGardenModel isSelected={isSelected} level={level} />;
  }
  if (cid.includes('recreation')) {
    return <RecreationCenterModel isSelected={isSelected} level={level} />;
  }

  // 2. Primary modelType routing
  switch (modelType) {
    case 'turbine':
      return <WindTurbineModel isSelected={isSelected} level={level} />;
    case 'solar':
      return <SolarArrayFieldModel isSelected={isSelected} level={level} />;
    case 'power_plant':
      return <FusionPowerPlantModel isSelected={isSelected} level={level} />;
    case 'observatory':
      return <ObservatoryModel isSelected={isSelected} level={level} />;
    case 'hospital':
      return <HospitalModel isSelected={isSelected} level={level} />;
    case 'academy':
      return <UniversityAcademyModel isSelected={isSelected} level={level} />;
    case 'factory':
      return <FactoryFoundryModel isSelected={isSelected} level={level} />;
    case 'warehouse':
      return <LogisticsWarehouseModel isSelected={isSelected} level={level} />;
    case 'water_treatment':
      return <WaterTreatmentPlantModel isSelected={isSelected} level={level} />;
    case 'park':
      return <BotanicalParkModel isSelected={isSelected} level={level} />;
    case 'hydroponic':
      return <AeroponicBioDomeModel isSelected={isSelected} level={level} />;
    case 'dome':
      return <AlgaeSynthesisBasinModel isSelected={isSelected} level={level} />;
    case 'citadel':
      return <SenateCitadelModel isSelected={isSelected} level={level} />;
    case 'commercial':
      return <ShoppingComplexModel isSelected={isSelected} level={level} />;
    case 'tower':
    default:
      if (category === 'commercial') {
        return <CommercialTowerModel isSelected={isSelected} level={level} />;
      }
      return <HighRiseArcologyModel isSelected={isSelected} level={level} />;
  }
}
