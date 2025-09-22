/**
 * API Tests for Recipe Recommender Backend
 * 
 * AI-Generated: Test suite created with AI assistance for comprehensive API testing
 */

const request = require('supertest');
const app = require('../server');

describe('Recipe Recommender API', () => {
  
  // Health check endpoint
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'Recipe Recommender API');
    });
  });

  // Recipe endpoints
  describe('GET /api/recipes', () => {
    it('should return all recipes', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter recipes by dietary restrictions', async () => {
      const response = await request(app)
        .get('/api/recipes?dietary=vegetarian')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that all returned recipes are vegetarian
      response.body.data.forEach(recipe => {
        expect(recipe.dietary).toContain('vegetarian');
      });
    });

    it('should filter recipes by max cooking time', async () => {
      const response = await request(app)
        .get('/api/recipes?maxTime=30')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that all returned recipes are under 30 minutes
      response.body.data.forEach(recipe => {
        expect(recipe.cookingTime).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('should return a specific recipe by ID', async () => {
      const response = await request(app)
        .get('/api/recipes/pasta-carbonara')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'pasta-carbonara');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('ingredients');
      expect(response.body.data).toHaveProperty('instructions');
    });

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/non-existent-recipe')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Recipe not found');
    });
  });

  describe('POST /api/recipes/search', () => {
    it('should search recipes by ingredients', async () => {
      const searchData = {
        ingredients: ['chicken', 'garlic', 'onion']
      };

      const response = await request(app)
        .post('/api/recipes/search')
        .send(searchData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('searchCriteria');
      
      // Check that results have match information
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('matchedIngredients');
        expect(response.body.data[0]).toHaveProperty('matchPercentage');
      }
    });

    it('should return 400 for empty ingredients', async () => {
      const searchData = {
        ingredients: []
      };

      const response = await request(app)
        .post('/api/recipes/search')
        .send(searchData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid input');
    });

    it('should filter by dietary preferences in search', async () => {
      const searchData = {
        ingredients: ['tomato', 'onion'],
        dietary: ['vegetarian']
      };

      const response = await request(app)
        .post('/api/recipes/search')
        .send(searchData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Check that all results are vegetarian
      response.body.data.forEach(recipe => {
        expect(recipe.dietary).toContain('vegetarian');
      });
    });
  });

  // Ingredients endpoints
  describe('GET /api/ingredients', () => {
    it('should return all ingredients', async () => {
      const response = await request(app)
        .get('/api/ingredients')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter ingredients by category', async () => {
      const response = await request(app)
        .get('/api/ingredients?category=vegetables')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Check that all returned ingredients are vegetables
      response.body.data.forEach(ingredient => {
        expect(ingredient.category).toBe('vegetables');
      });
    });

    it('should search ingredients by name', async () => {
      const response = await request(app)
        .get('/api/ingredients?search=tomato')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Check that results contain tomato
      const hasMatch = response.body.data.some(ingredient => 
        ingredient.name.toLowerCase().includes('tomato')
      );
      expect(hasMatch).toBe(true);
    });
  });

  describe('GET /api/ingredients/categories', () => {
    it('should return all ingredient categories', async () => {
      const response = await request(app)
        .get('/api/ingredients/categories')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  // Recommendations endpoints
  describe('POST /api/recommendations', () => {
    it('should return recipe recommendations', async () => {
      const requestData = {
        availableIngredients: ['chicken', 'tomato', 'onion'],
        dietary: [],
        maxCookingTime: 60
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('topRecommendations');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('criteria');
      expect(Array.isArray(response.body.topRecommendations)).toBe(true);
    });

    it('should score recipes correctly', async () => {
      const requestData = {
        availableIngredients: ['chicken', 'garlic', 'olive oil'],
        maxCookingTime: 30
      };

      const response = await request(app)
        .post('/api/recommendations')
        .send(requestData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Check that recommendations have scores
      response.body.topRecommendations.forEach(recipe => {
        expect(recipe).toHaveProperty('recommendationScore');
        expect(recipe.recommendationScore).toBeGreaterThanOrEqual(0);
        expect(recipe.recommendationScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('GET /api/recommendations/popular', () => {
    it('should return popular recipes', async () => {
      const response = await request(app)
        .get('/api/recommendations/popular')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10); // default limit
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations/popular?limit=5')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/recommendations/quick', () => {
    it('should return quick recipes', async () => {
      const response = await request(app)
        .get('/api/recommendations/quick')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that all recipes are under 30 minutes (default)
      response.body.data.forEach(recipe => {
        expect(recipe.cookingTime).toBeLessThanOrEqual(30);
      });
    });

    it('should respect maxTime parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations/quick?maxTime=15')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Check that all recipes are under 15 minutes
      response.body.data.forEach(recipe => {
        expect(recipe.cookingTime).toBeLessThanOrEqual(15);
      });
    });
  });

  // Error handling
  describe('Error Handling', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });

    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/recipes/search')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  // Recipe rating endpoint
  describe('POST /api/recipes/:id/rate', () => {
    it('should accept valid rating', async () => {
      const ratingData = {
        rating: 5,
        review: 'Excellent recipe!'
      };

      const response = await request(app)
        .post('/api/recipes/pasta-carbonara/rate')
        .send(ratingData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rating', 5);
      expect(response.body.data).toHaveProperty('review');
    });

    it('should reject invalid rating', async () => {
      const ratingData = {
        rating: 6 // Invalid - should be 1-5
      };

      const response = await request(app)
        .post('/api/recipes/pasta-carbonara/rate')
        .send(ratingData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid rating');
    });
  });
});

// Test data validation helpers
describe('Data Validation', () => {
  it('should have consistent recipe data structure', async () => {
    const response = await request(app)
      .get('/api/recipes')
      .expect(200);
    
    response.body.data.forEach(recipe => {
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('name');
      expect(recipe).toHaveProperty('description');
      expect(recipe).toHaveProperty('cookingTime');
      expect(recipe).toHaveProperty('ingredients');
      expect(recipe).toHaveProperty('instructions');
      
      expect(Array.isArray(recipe.ingredients)).toBe(true);
      expect(Array.isArray(recipe.instructions)).toBe(true);
      expect(typeof recipe.cookingTime).toBe('number');
    });
  });

  it('should have consistent ingredient data structure', async () => {
    const response = await request(app)
      .get('/api/ingredients')
      .expect(200);
    
    response.body.data.forEach(ingredient => {
      expect(ingredient).toHaveProperty('id');
      expect(ingredient).toHaveProperty('name');
      expect(ingredient).toHaveProperty('category');
    });
  });
});
