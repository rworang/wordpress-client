export interface Author {
  id: number;
  name: string;
  url: string;
  description: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  author: Author;
  featuredImage: {
    id: number | undefined;
    url: string;
    alt: string;
  };
  featuredMedia?: Media;
  date: string;
  categories: Category[];
}

export interface Media {
  url: string;
  id: number;
  alt: string;
  mimeType: string;
  width: number;
  height: number;
  sizes: Record<
    string,
    {
      url: string;
      width: number;
      height: number;
      mimeType: string;
      filesize?: number;
    }
  >;
}
