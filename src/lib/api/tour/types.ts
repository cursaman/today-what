export interface TourApiItem {
  contentid: string;
  contenttypeid?: string;
  title: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  tel?: string;
  modifiedtime?: string;
}

export type TourCategory = "all" | "12" | "14" | "15" | "28";

export interface TourCategoryOption {
  id: TourCategory;
  label: string;
}
