/** TypeScript models for the Risk Scenario planning feature */

export interface ScenarioAccountItem {
  accountId: number;
  name: string;
  institutionName: string;
  accountType: string;
  balance: string | null;
  ownerInitials: string;
  ownerName: string;
}

export interface ScenarioGroup {
  linkId: number;
  groupId: number;
  name: string;
  sortOrder: number;
  accounts: ScenarioAccountItem[];
}

export interface ScenarioListItem {
  scenarioId: number;
  name: string;
  ownerUserId: number;
  isOwner: boolean;
  groupCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioDetail {
  scenarioId: number;
  name: string;
  ownerUserId: number;
  isOwner: boolean;
  groups: ScenarioGroup[];
  unassigned: ScenarioAccountItem[];
}
