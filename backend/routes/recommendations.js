/**
 * Recommendations Routes
 * Advanced recipe recommendation algorithms
 * 
 * AI-Assisted: Recommendation logic and scoring algorithms enhanced with AI
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper functions
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

const loadIngredients = async () => {
  try {
    const dataPath = path.join(__dirname, '../../data/ingredients.json');
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading ingredients:', error);
    return [];
  }
};

// POST /api/recommendations - Get personalized recipe recommendations
router.post('/', async (req, res) => {
  try {
    const { 
      availableIngredients = [], 
      dietary = [], 
      maxCookingTime, 
      difficulty,
      cuisinePreference,
      excludeIngredients = [],
      servings,
      mealType
    } = req.body;
    
    const recipes = await loadRecipes();
    const ingredients = await loadIngredients();
    
    // Normalize input
    const normalizedAvailable = availableIngredients.map(ing => ing.toLowerCase().trim());
    const normalizedExclude = excludeIngredients.map(ing => ing.toLowerCase().trim());
    
    // Score each recipe using multiple factors
    const scoredRecipes = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(ing => 
        (ing.name || ing).toLowerCase()
      );
      
      // Factor 1: Ingredient availability (40% weight)
      const availableMatches = recipeIngredients.filter(recipeIng =>
        normalizedAvailable.some(availIng =>
          recipeIng.includes(availIng) || availIng.includes(recipeIng)
        )
      );
      const ingredientScore = (availableMatches.length / recipeIngredients.length) * 40;
      
      // Factor 2: Missing ingredients penalty (20% weight)
      const missingCount = recipeIngredients.length - availableMatches.length;
      const missingPenalty = Math.max(0, 20 - (missingCount * 5));
      
      // Factor 3: Recipe rating (15% weight)
      const ratingScore = ((recipe.rating || 3) / 5) * 15;
      
      // Factor 4: Cooking time preference (10% weight)
      let timeScore = 10;
      if (maxCookingTime) {
        if (recipe.cookingTime <= maxCookingTime) {
          timeScore = 10;
        } else if (recipe.cookingTime <= maxCookingTime * 1.5) {
          timeScore = 5;
        } else {
          timeScore = 0;
        }
      }
      
      // Factor 5: Difficulty preference (5% weight)
      let difficultyScore = 5;
      if (difficulty) {
        difficultyScore = recipe.difficulty?.toLowerCase() === difficulty.toLowerCase() ? 5 : 2;
      }
      
      // Factor 6: Cuisine preference (5% weight)
      let cuisineScore = 5;
      if (cuisinePreference) {
        cuisineScore = recipe.cuisine?.toLowerCase() === cuisinePreference.toLowerCase() ? 5 : 2;
      }
      
      // Factor 7: Meal type match (5% weight)
      let mealTypeScore = 5;
      if (mealType) {
        mealTypeScore = recipe.mealType?.toLowerCase() === mealType.toLowerCase() ? 5 : 2;
      }
      
      // Calculate total score
      const totalScore = ingredientScore + missingPenalty + ratingScore + 
                        timeScore + difficultyScore + cuisineScore + mealTypeScore;
      
      return {
        ...recipe,
        recommendationScore: Math.round(totalScore),
        availableIngredients: availableMatches,
        missingIngredients: recipeIngredients.filter(recipeIng =>
          !normalizedAvailable.some(availIng =>
            recipeIng.includes(availIng) || availIng.includes(recipeIng)
          )
        ),
        ingredientMatch: Math.round((availableMatches.length / recipeIngredients.length) * 100),
        factors: {
          ingredientScore: Math.round(ingredientScore),
          missingPenalty: Math.round(missingPenalty),
          ratingScore: Math.round(ratingScore),
          timeScore,
          difficultyScore,
          cuisineScore,
          mealTypeScore
        }
      };
    });
    
    // Apply filters
    let filteredRecipes = scoredRecipes
      .filter(recipe => recipe.availableIngredients.length > 0) // Must have at least one ingredient
      .filter(recipe => {
        // Check excluded ingredients
        const recipeIngredients = recipe.ingredients.map(ing => 
          (ing.name || ing).toLowerCase()
        );
        return !normalizedExclude.some(excludeIng =>
          recipeIngredients.some(recipeIng =>
            recipeIng.includes(excludeIng) || excludeIng.includes(recipeIng)
          )
        );
      });
    
    // Apply dietary filters
    if (dietary.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        dietary.every(diet => recipe.dietary?.includes(diet))
      );
    }
    
    // Apply cooking time filter (strict)
    if (maxCookingTime) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.cookingTime <= maxCookingTime
      );
    }
    
    // Apply servings filter
    if (servings) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        !recipe.servings || Math.abs(recipe.servings - servings) <= 2
      );
    }
    
    // Sort by recommendation score
    filteredRecipes.sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    // Group recommendations by score ranges
    const excellent = filteredRecipes.filter(r => r.recommendationScore >= 80);
    const good = filteredRecipes.filter(r => r.recommendationScore >= 60 && r.recommendationScore < 80);
    const fair = filteredRecipes.filter(r => r.recommendationScore >= 40 && r.recommendationScore < 60);
    
    res.json({
      success: true,
      totalRecipes: filteredRecipes.length,
      criteria: {
        availableIngredients: normalizedAvailable,
        dietary,
        maxCookingTime,
        difficulty,
        cuisinePreference,
        excludeIngredients: normalizedExclude,
        servings,
        mealType
      },
      recommendations: {
        excellent: { count: excellent.length, recipes: excellent.slice(0, 5) },
        good: { count: good.length, recipes: good.slice(0, 5) },
        fair: { count: fair.length, recipes: fair.slice(0, 3) }
      },
      topRecommendations: filteredRecipes.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Recommendation failed',
      message: error.message
    });
  }
});

// GET /api/recommendations/popular - Get popular recipes
router.get('/popular', async (req, res) => {
  try {
    const recipes = await loadRecipes();
    const { limit = 10, category } = req.query;
    
    let popularRecipes = recipes;
    
    // Filter by category if provided
    if (category) {
      popularRecipes = popularRecipes.filter(recipe =>
        recipe.category?.toLowerCase() === category.toLowerCase() ||
        recipe.cuisine?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Sort by rating and view count
    popularRecipes.sort((a, b) => {
      const scoreA = (a.rating || 0) * 0.7 + (a.views || 0) * 0.3;
      const scoreB = (b.rating || 0) * 0.7 + (b.views || 0) * 0.3;
      return scoreB - scoreA;
    });
    
    res.json({
      success: true,
      count: popularRecipes.length,
      data: popularRecipes.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular recipes',
      message: error.message
    });
  }
});

// GET /api/recommendations/quick - Get quick recipes (under 30 minutes)
router.get('/quick', async (req, res) => {
  try {
    const recipes = await loadRecipes();
    const { maxTime = 30, limit = 10 } = req.query;
    
    const quickRecipes = recipes
      .filter(recipe => recipe.cookingTime <= parseInt(maxTime))
      .sort((a, b) => a.cookingTime - b.cookingTime || (b.rating || 0) - (a.rating || 0));
    
    res.json({
      success: true,
      criteria: { maxCookingTime: parseInt(maxTime) },
      count: quickRecipes.length,
      data: quickRecipes.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick recipes',
      message: error.message
    });
  }
});

module.exports = router;
