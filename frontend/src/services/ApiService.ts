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
  TaxDocument,
} from '@models/TaxModels';
import { institutionCredentialService } from '@services/InstitutionCredentialService';
import { accountGroupCrudService } from '@services/AccountGroupCrudService';
import { analyticsService } from '@services/AnalyticsService';
import { shareSaleService } from '@services/ShareSaleService';
import { taxService } from '@services/TaxService';
import { familyService } from '@services/FamilyService';
import { giftService } from '@services/GiftService';
import { ApiServiceBase } from '@services/ApiServiceBase';

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

  async listTaxPeriods(): Promise<TaxPeriod[]> {
    return taxService.listPeriods();
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

  async uploadTaxDocument(periodId: number, accountId: number, file: File): Promise<TaxDocument> {
    return taxService.uploadDocument(periodId, accountId, file);
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
}

export const apiService = new ApiService();
