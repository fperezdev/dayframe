import { create } from 'zustand';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@dayframe/shared';
import {
  createCategory as dbCreateCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  getAllCategories,
} from '../db/categories';
import { enqueueSyncItem } from '../db/sync';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  // Actions
  loadCategories: (userId: string) => Promise<void>;
  createCategory: (userId: string, input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,

  loadCategories: async (userId) => {
    set({ isLoading: true });
    const categories = await getAllCategories(userId);
    set({ categories, isLoading: false });
  },

  createCategory: async (userId, input) => {
    const category = await dbCreateCategory(userId, input);
    await enqueueSyncItem('category', category.id, 'create', category);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  updateCategory: async (id, input) => {
    const category = await dbUpdateCategory(id, input);
    await enqueueSyncItem('category', category.id, 'update', category);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? category : c)),
    }));
    return category;
  },

  deleteCategory: async (id) => {
    await dbDeleteCategory(id);
    await enqueueSyncItem('category', id, 'delete', { id });
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
