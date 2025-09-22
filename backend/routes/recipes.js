/**
 * Recipe Routes
 * Handles all recipe-related API endpoints
 * 
 * AI-Assisted: Route structure and validation patterns generated with AI help
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to load recipes data
const loadRecipes = async () => {
  try {
    const dataPath = path.join(__dirname, '../../data/recipes.json');
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading recipes:', error);
    return [];
  }
};

// GET /api/recipes - Get all recipes with optional filtering
router.get('/', async (req, res) => {
  try {
    const recipes = await loadRecipes();
    const { dietary, maxTime, difficulty } = req.query;
    
    let filteredRecipes = recipes;
    
    // Apply dietary filters
    if (dietary) {
      const dietaryArray = dietary.split(',');
      filteredRecipes = filteredRecipes.filter(recipe => 
        dietaryArray.every(diet => recipe.dietary?.includes(diet))
      );
    }
    
    // Apply cooking time filter
    if (maxTime) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.cookingTime <= parseInt(maxTime)
      );
    }
    
    // Apply difficulty filter
    if (difficulty) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      count: filteredRecipes.length,
      data: filteredRecipes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipes',
      message: error.message
    });
  }
});

// GET /api/recipes/:id - Get specific recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipes = await loadRecipes();
    const recipe = recipes.find(r => r.id === req.params.id);
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found',
        message: `Recipe with ID ${req.params.id} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipe',
      message: error.message
    });
  }
});

// POST /api/recipes/search - Search recipes by ingredients
router.post('/search', async (req, res) => {
  try {
    const { ingredients, mustHave = [], dietary = [], maxTime } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Please provide an array of ingredients'
      });
    }
    
    const recipes = await loadRecipes();
    const searchIngredients = ingredients.map(ing => ing.toLowerCase().trim());
    const mustHaveIngredients = mustHave.map(ing => ing.toLowerCase().trim());
    
    // Score recipes based on ingredient matches
    const scoredRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(ing => 
        ing.name?.toLowerCase() || ing.toLowerCase()
      );
      
      // Count matching ingredients
      const matches = searchIngredients.filter(searchIng =>
        recipeIngredients.some(recipeIng => 
          recipeIng.includes(searchIng) || searchIng.includes(recipeIng)
        )
      );
      
      // Check if all must-have ingredients are present
      const hasMustHave = mustHaveIngredients.every(mustIng =>
        recipeIngredients.some(recipeIng => 
          recipeIng.includes(mustIng) || mustIng.includes(recipeIng)
        )
      );
      
      // Calculate match percentage
      const matchPercentage = (matches.length / recipeIngredients.length) * 100;
      
      return {
        ...recipe,
        matchedIngredients: matches.length,
        totalIngredients: recipeIngredients.length,
        matchPercentage: Math.round(matchPercentage),
        hasMustHave,
        missingIngredients: recipeIngredients.filter(recipeIng =>
          !searchIngredients.some(searchIng => 
            recipeIng.includes(searchIng) || searchIng.includes(recipeIng)
          )
        ).length
      };
    });
    
    // Filter and sort results
    let results = scoredRecipes
      .filter(recipe => recipe.matchedIngredients > 0) // At least one match
      .filter(recipe => mustHaveIngredients.length === 0 || recipe.hasMustHave); // Must-have check
    
    // Apply dietary filters
    if (dietary.length > 0) {
      results = results.filter(recipe => 
        dietary.every(diet => recipe.dietary?.includes(diet))
      );
    }
    
    // Apply time filter
    if (maxTime) {
      results = results.filter(recipe => recipe.cookingTime <= parseInt(maxTime));
    }
    
    // Sort by match percentage and then by rating
    results.sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
    
    res.json({
      success: true,
      count: results.length,
      searchCriteria: {
        ingredients: searchIngredients,
        mustHave: mustHaveIngredients,
        dietary,
        maxTime
      },
      data: results.slice(0, 20) // Return top 20 matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// POST /api/recipes/:id/rate - Rate a recipe
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // In a real app, this would update the database
    // For now, we'll just simulate the response
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        recipeId: req.params.id,
        rating,
        review: review || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to submit rating',
      message: error.message
    });
  }
});

module.exports = router;
