# @worang/wordpress-client

Typed WordPress REST API client for TypeScript/JavaScript projects.

## Installation

```bash
npm install github:rworang/wordpress-client
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "@worang/wordpress-client": "github:rworang/wordpress-client"
  }
}
```

## Usage

```typescript
import { WordpressClient } from '@worang/wordpress-client'

const client = new WordpressClient({
  baseURL: 'https://your-wordpress-site.com',
})

// Fetch posts with pagination
const { data: posts, pagination } = await client.posts({
  page: 1,
  per_page: 10,
  categories: [5],
  orderby: 'date',
  order: 'desc',
})

// Fetch single post by slug
const post = await client.post('my-post-slug')

// Fetch categories
const { data: categories } = await client.categories()
```

## API

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | required | WordPress site URL |
| `namespace` | `string` | `'wp/v2'` | REST API namespace |
| `timeout` | `number` | `10000` | Request timeout in ms |

### Methods

- `posts(params?)` - List posts with pagination
- `post(slug)` - Get single post by slug
- `postById(id)` - Get single post by ID
- `categories(params?)` - List categories
- `category(slug)` - Get single category by slug
- `media(id)` - Get single media item
- `mediaList(params?)` - List media items

## License

MIT
