/** API service facade — extends base with groups, analytics, and share sale */
import type {
  PortfolioBreakdown,
  PortfolioHistory,
  InstitutionCredential,
  InstitutionCredentialCreate,
  InstitutionCredentialUpdate,
  AccountGroup,
  AccountGroupCreateRequest,
  AccountGroupUpdateRequest,
  AccountEventCreateRequest,
} from '@models/WealthTrackDataModels';
import type { ShareSaleRequest, ShareSaleResponse, ShareSaleSummary } from '@models/ShareSaleModels';
import type { Family, UserSummary } from '@models/family';
import type { GiftSummary, RecordGiftRequest, RecordGiftResponse } from '@models/gift';
import type { Portfolio } from '@models/WealthTrackDataModels';
import type {
  TaxPeriod,
  TaxPeriodAccountsResponse,
  TaxPeriodCreateRequest,
  TaxReturn,
  TaxReturnUpsertRequest,
  TaxScopeUpdateRequest,
  TaxDocument,
} from '@models/TaxModels';
import { institutionCredentialService } from '@services/InstitutionCredentialService';
import { accountGroupCrudService } from '@services/AccountGroupCrudService';
import { analyticsService } from '@services/AnalyticsService';
import { shareSaleService } from '@services/ShareSaleService';
import { taxService } from '@services/TaxService';
import { familyService } from '@services/FamilyService';
import { giftService } from '@services/GiftService';
import { scenarioService } from '@services/ScenarioService';
import { ApiServiceBase } from '@services/ApiServiceBase';
import type { ScenarioDetail, ScenarioGroup, ScenarioListItem } from '@models/scenario';

class ApiService extends ApiServiceBase {
  async listInstitutionCredentials(institutionId: number): Promise<InstitutionCredential[]> {
    return institutionCredentialService.list(institutionId);
  }

  async createInstitutionCredential(
    institutionId: number,
    payload: InstitutionCredentialCreate,
  ): Promise<InstitutionCredential> {
    return institutionCredentialService.create(institutionId, payload);
  }

  async updateInstitutionCredential(
    institutionId: number,
    credentialId: number,
    payload: InstitutionCredentialUpdate,
  ): Promise<InstitutionCredential> {
    return institutionCredentialService.update(institutionId, credentialId, payload);
  }

  async deleteInstitutionCredential(institutionId: number, credentialId: number): Promise<void> {
    return institutionCredentialService.delete(institutionId, credentialId);
  }

  async getAccountGroups(): Promise<AccountGroup[]> {
    return accountGroupCrudService.getAccountGroups();
  }

  async getAccountGroup(groupId: number): Promise<AccountGroup> {
    return accountGroupCrudService.getAccountGroup(groupId);
  }

  async createAccountGroup(data: AccountGroupCreateRequest): Promise<AccountGroup> {
    return accountGroupCrudService.createAccountGroup(data);
  }

  async updateAccountGroup(groupId: number, data: AccountGroupUpdateRequest): Promise<AccountGroup> {
    return accountGroupCrudService.updateAccountGroup(groupId, data);
  }

  async deleteAccountGroup(groupId: number): Promise<void> {
    return accountGroupCrudService.deleteAccountGroup(groupId);
  }

  async addAccountToGroup(groupId: number, accountId: number): Promise<void> {
    return accountGroupCrudService.addAccountToGroup(groupId, accountId);
  }

  async removeAccountFromGroup(groupId: number, accountId: number): Promise<void> {
    return accountGroupCrudService.removeAccountFromGroup(groupId, accountId);
  }

  async getGroupMembers(groupId: number): Promise<number[]> {
    return accountGroupCrudService.getGroupMembers(groupId);
  }

  async getAnalyticsBreakdown(): Promise<PortfolioBreakdown> {
    return analyticsService.getBreakdown();
  }

  async getAnalyticsHistory(): Promise<PortfolioHistory> {
    return analyticsService.getPortfolioHistory();
  }

  async recordShareSale(data: ShareSaleRequest): Promise<ShareSaleResponse> {
    return shareSaleService.recordSale(data);
  }

  async getShareSaleHistory(accountId: number): Promise<ShareSaleSummary[]> {
    return shareSaleService.getHistory(accountId);
  }

  async reverseShareSale(groupId: number): Promise<void> {
    return shareSaleService.deleteSale(groupId);
  }

  async listTaxPeriods(memberId?: number): Promise<TaxPeriod[]> {
    return taxService.listPeriods(memberId);
  }

  async downloadTaxBriefingPack(periodId: number, memberId?: number): Promise<Blob> {
    return taxService.downloadBriefingPack(periodId, memberId);
  }

  async createTaxPeriod(data: TaxPeriodCreateRequest): Promise<TaxPeriod> {
    return taxService.createPeriod(data);
  }

  async deleteTaxPeriod(periodId: number): Promise<void> {
    return taxService.deletePeriod(periodId);
  }

  async getTaxEligibleAccounts(periodId: number): Promise<TaxPeriodAccountsResponse> {
    return taxService.getEligibleAccounts(periodId);
  }

  async upsertTaxReturn(
    periodId: number,
    accountId: number,
    data: TaxReturnUpsertRequest,
  ): Promise<TaxReturn> {
    return taxService.upsertReturn(periodId, accountId, data);
  }

  async setTaxScope(
    periodId: number,
    accountId: number,
    data: TaxScopeUpdateRequest,
  ): Promise<TaxReturn> {
    return taxService.setScope(periodId, accountId, data);
  }

  async uploadTaxDocument(periodId: number, accountId: number, file: File, description?: string): Promise<TaxDocument> {
    return taxService.uploadDocument(periodId, accountId, file, description);
  }

  async updateTaxDocumentDescription(docId: number, description: string | null): Promise<TaxDocument> {
    return taxService.updateDescription(docId, description);
  }

  async downloadTaxDocument(docId: number): Promise<Blob> {
    return taxService.downloadDocument(docId);
  }

  async deleteTaxDocument(docId: number): Promise<void> {
    return taxService.deleteDocument(docId);
  }

  async getFamilies(): Promise<Family[]> {
    return familyService.getFamilies();
  }

  async createFamily(name: string): Promise<Family> {
    return familyService.createFamily(name);
  }

  async renameFamily(familyId: number, name: string): Promise<Family> {
    return familyService.renameFamily(familyId, name);
  }

  async deleteFamily(familyId: number): Promise<void> {
    return familyService.deleteFamily(familyId);
  }

  async getAvailableMembers(familyId: number): Promise<UserSummary[]> {
    return familyService.getAvailableMembers(familyId);
  }

  async addFamilyMember(familyId: number, accountId: number): Promise<Family> {
    return familyService.addMember(familyId, accountId);
  }

  async removeFamilyMember(familyId: number, memberId: number): Promise<Family> {
    return familyService.removeMember(familyId, memberId);
  }

  async getFamilyMemberPortfolio(familyId: number, memberId: number): Promise<Portfolio> {
    return familyService.getMemberPortfolio(familyId, memberId);
  }

  async createFamilyMemberEvent(
    familyId: number, memberId: number, accountId: number,
    data: AccountEventCreateRequest,
  ): Promise<void> {
    return familyService.createMemberEvent(familyId, memberId, accountId, data);
  }

  async recordGift(accountId: number, data: RecordGiftRequest): Promise<RecordGiftResponse> {
    return giftService.recordGift(accountId, data);
  }

  async listGifts(): Promise<GiftSummary[]> {
    return giftService.listGifts();
  }

  async deleteGift(groupId: number): Promise<void> {
    return giftService.deleteGift(groupId);
  }

  async deleteGiftByEventId(eventId: number): Promise<void> {
    return giftService.deleteGiftByEventId(eventId);
  }

  async listScenarios(): Promise<ScenarioListItem[]> { return scenarioService.listScenarios(); }
  async createScenario(name: string): Promise<ScenarioListItem> { return scenarioService.createScenario(name); }
  async getScenario(id: number): Promise<ScenarioDetail> { return scenarioService.getScenario(id); }
  async renameScenario(id: number, name: string): Promise<ScenarioListItem> { return scenarioService.renameScenario(id, name); }
  async deleteScenario(id: number): Promise<void> { return scenarioService.deleteScenario(id); }
  async addScenarioGroup(id: number, name: string): Promise<ScenarioGroup> { return scenarioService.addGroup(id, name); }
  async renameScenarioGroup(id: number, linkId: number, name: string): Promise<ScenarioGroup> { return scenarioService.renameGroup(id, linkId, name); }
  async deleteScenarioGroup(id: number, linkId: number): Promise<void> { return scenarioService.deleteGroup(id, linkId); }
  async assignScenarioAccount(id: number, accountId: number, groupId: number | null): Promise<void> { return scenarioService.assignAccount(id, accountId, groupId); }
}

export const apiService = new ApiService();
