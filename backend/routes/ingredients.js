/**
 * Ingredients Routes
 * Handles ingredient-related API endpoints
 * 
 * AI-Generated: Route handlers for ingredient management and search
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to load ingredients data
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

// GET /api/ingredients - Get all ingredients
router.get('/', async (req, res) => {
  try {
    const ingredients = await loadIngredients();
    const { category, search } = req.query;
    
    let filteredIngredients = ingredients;
    
    // Filter by category if provided
    if (category) {
      filteredIngredients = filteredIngredients.filter(ing => 
        ing.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Search ingredients by name if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredIngredients = filteredIngredients.filter(ing =>
        ing.name?.toLowerCase().includes(searchTerm) ||
        ing.aliases?.some(alias => alias.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      count: filteredIngredients.length,
      data: filteredIngredients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ingredients',
      message: error.message
    });
  }
});

// GET /api/ingredients/categories - Get all ingredient categories
router.get('/categories', async (req, res) => {
  try {
    const ingredients = await loadIngredients();
    const categories = [...new Set(ingredients.map(ing => ing.category).filter(Boolean))];
    
    res.json({
      success: true,
      count: categories.length,
      data: categories.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/ingredients/:name/substitutes - Get ingredient substitutes
router.get('/:name/substitutes', async (req, res) => {
  try {
    const ingredients = await loadIngredients();
    const ingredientName = req.params.name.toLowerCase();
    
    const ingredient = ingredients.find(ing => 
      ing.name?.toLowerCase() === ingredientName ||
      ing.aliases?.some(alias => alias.toLowerCase() === ingredientName)
    );
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: 'Ingredient not found',
        message: `No ingredient found with name: ${req.params.name}`
      });
    }
    
    // Find substitutes by category and dietary properties
    const substitutes = ingredients.filter(ing => 
      ing.id !== ingredient.id &&
      ing.category === ingredient.category &&
      ing.substituteFor?.includes(ingredient.name)
    );
    
    res.json({
      success: true,
      ingredient: ingredient.name,
      count: substitutes.length,
      data: substitutes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch substitutes',
      message: error.message
    });
  }
});

// POST /api/ingredients/validate - Validate ingredient list
router.post('/validate', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Please provide an array of ingredient names'
      });
    }
    
    const allIngredients = await loadIngredients();
    const validation = ingredients.map(inputIng => {
      const normalizedInput = inputIng.toLowerCase().trim();
      
      // Find exact or alias match
      const found = allIngredients.find(ing =>
        ing.name?.toLowerCase() === normalizedInput ||
        ing.aliases?.some(alias => alias.toLowerCase() === normalizedInput)
      );
      
      // Find similar ingredients if no exact match
      const similar = !found ? allIngredients.filter(ing =>
        ing.name?.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(ing.name?.toLowerCase()) ||
        ing.aliases?.some(alias => 
          alias.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(alias.toLowerCase())
        )
      ).slice(0, 3) : [];
      
      return {
        input: inputIng,
        found: !!found,
        ingredient: found || null,
        suggestions: similar
      };
    });
    
    const validCount = validation.filter(v => v.found).length;
    
    res.json({
      success: true,
      totalIngredients: ingredients.length,
      validIngredients: validCount,
      invalidIngredients: ingredients.length - validCount,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error.message
    });
  }
});

module.exports = router;
