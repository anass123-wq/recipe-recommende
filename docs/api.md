# Recipe Recommender API Documentation

## Base URL
- Development: `http://localhost:3001`

## Endpoints

### Health Check

#### GET /health
Returns the health status of the API server.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-22T19:30:55.000Z",
  "uptime": 123.456
}
```

### Recipes

#### GET /api/recipes
Get all recipes with optional filtering.

**Query Parameters:**
- `dietary` (optional): Filter by dietary restrictions (vegetarian, vegan, gluten-free)
- `maxTime` (optional): Filter by maximum cooking time in minutes
- `difficulty` (optional): Filter by difficulty level (easy, medium, hard)

**Example:**
```
GET /api/recipes?dietary=vegetarian&maxTime=30
```

**Response:**
```json
[
  {
    "id": "pasta-carbonara",
    "name": "Pasta Carbonara",
    "description": "Classic Italian pasta dish",
    "ingredients": ["pasta", "eggs", "bacon"],
    "instructions": ["Step 1", "Step 2"],
    "cookTime": 20,
    "difficulty": "medium",
    "dietary": [],
    "rating": 4.5,
    "cuisine": "Italian"
  }
]
```

#### GET /api/recipes/:id
Get a specific recipe by ID.

**Parameters:**
- `id`: Recipe identifier

**Response:**
- `200`: Recipe object
- `404`: Recipe not found

#### POST /api/recipes/search
Search recipes by available ingredients.

**Request Body:**
```json
{
  "ingredients": ["tomato", "cheese"],
  "dietary": "vegetarian",
  "maxTime": 30,
  "difficulty": "easy"
}
```

**Response:**
```json
{
  "recipes": [
    {
      "id": "margherita-pizza",
      "name": "Margherita Pizza",
      "matchScore": 85,
      "availableIngredients": ["tomato", "cheese"],
      "missingIngredients": ["basil"]
    }
  ],
  "totalMatches": 1
}
```

#### POST /api/recipes/:id/rate
Rate a recipe.

**Request Body:**
```json
{
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "newRating": 4.6
}
```

### Ingredients

#### GET /api/ingredients
Get all ingredients with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by ingredient category
- `search` (optional): Search ingredients by name

**Example:**
```
GET /api/ingredients?category=vegetables&search=tomato
```

**Response:**
```json
[
  {
    "id": "tomato",
    "name": "Tomato",
    "category": "vegetables",
    "commonUses": ["salads", "sauces"],
    "substitutes": ["sun-dried tomatoes"]
  }
]
```

#### GET /api/ingredients/categories
Get all available ingredient categories.

**Response:**
```json
[
  "vegetables",
  "proteins",
  "grains",
  "dairy",
  "herbs-spices"
]
```

### Recommendations

#### POST /api/recommendations
Get personalized recipe recommendations.

**Request Body:**
```json
{
  "ingredients": ["chicken", "rice"],
  "preferences": {
    "dietary": "gluten-free",
    "maxTime": 45,
    "difficulty": "easy"
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "recipe": {
        "id": "chicken-rice-bowl",
        "name": "Chicken Rice Bowl"
      },
      "score": 92,
      "reasons": [
        "High ingredient match (80%)",
        "Meets dietary preferences",
        "Quick cooking time"
      ]
    }
  ],
  "totalRecommendations": 5
}
```

#### GET /api/recommendations/popular
Get popular recipes based on ratings.

**Query Parameters:**
- `limit` (optional): Number of recipes to return (default: 10)

**Response:**
```json
[
  {
    "id": "pasta-carbonara",
    "name": "Pasta Carbonara",
    "rating": 4.8,
    "popularity": 95
  }
]
```

#### GET /api/recommendations/quick
Get quick recipes for fast cooking.

**Query Parameters:**
- `maxTime` (optional): Maximum cooking time in minutes (default: 30)

**Response:**
```json
[
  {
    "id": "quick-omelette",
    "name": "Quick Omelette",
    "cookTime": 10,
    "difficulty": "easy"
  }
]
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### Status Codes
- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting
Currently no rate limiting is implemented. In production, consider implementing rate limiting based on IP address.

## Authentication
No authentication is currently required. For production use, implement JWT-based authentication.

## CORS
CORS is enabled for all origins in development. Configure appropriately for production.
