/** Family wealth management data models */

export interface FamilyMember {
  id: number;
  accountId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Family {
  id: number;
  name: string;
  ownerId: number;
  isOwner: boolean;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string | null;
}

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
