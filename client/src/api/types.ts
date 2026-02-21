// Shared frontend view models aligned with backend API response shapes.
export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "VIEWER";
};

export type PhotoListItem = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  thumbUrl: string;
  tags: string[];
};

export type PhotoDetail = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  width: number;
  height: number;
  tags: string[];
  sizes: {
    "320": string;
    "768": string;
    "1280": string;
    original: string;
  };
};

export type AlbumListItem = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  coverPhotoId?: string | null;
  coverUrl?: string | null;
};

export type AlbumDetail = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  photos: PhotoListItem[];
};

export type ShareResponse =
  | { resourceType: "photo"; resource: PhotoDetail }
  | { resourceType: "album"; resource: AlbumDetail };
