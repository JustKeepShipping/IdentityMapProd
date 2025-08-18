export type Lens = 'GIVEN' | 'CHOSEN' | 'CORE';
export type ItemType = 'tag' | 'text';

export interface IdentityDraftItem {
  lens: Lens;
  type: ItemType;
  label?: string;
  value: string;
  weight: 1 | 2 | 3;
}

export interface IdentityItem extends IdentityDraftItem {
  id: string;
  participantId: string;
  createdAt: string;
}
