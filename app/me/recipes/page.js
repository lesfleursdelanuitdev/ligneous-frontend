'use client';

import { useState } from 'react';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder, TagsCell } from '@/components/shared/data-display';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useMyRecipes } from '@/hooks/queries/useMyRecipes';

const DUMMY_RECIPES = [
  { id: '1', title: "Grandma Rosa's Sunday Gravy", content: 'A rich tomato sauce passed down through generations.', recipeIngredients: 'San Marzano tomatoes, garlic, basil, olive oil, pork ribs, Italian sausage', recipeInstructions: 'Brown the meats. Saute garlic in olive oil. Add crushed tomatoes and simmer for 4 hours.', visibility: 'public', tags: ['Italian', 'Family'], createdAt: '2025-12-01' },
  { id: '2', title: "Great Aunt Marie's Pierogies", content: 'Traditional Polish dumplings filled with potato and cheese.', recipeIngredients: 'Flour, eggs, potatoes, cheddar cheese, onions, butter, sour cream', recipeInstructions: 'Make dough, rest 30 min. Boil potatoes, mash with cheese. Fill and pinch dough. Boil then pan-fry.', visibility: 'followers_only', tags: ['Polish', 'Holiday'], createdAt: '2025-11-15' },
  { id: '3', title: "Dad's BBQ Brisket Rub", content: 'The secret rub recipe Dad perfected over 20 years.', recipeIngredients: 'Brown sugar, paprika, garlic powder, onion powder, cumin, black pepper, cayenne, salt', recipeInstructions: 'Mix all dry ingredients. Rub generously on brisket. Smoke at 225F for 12 hours.', visibility: 'private', tags: ['BBQ', 'American'], createdAt: '2025-10-20' },
  { id: '4', title: "Nana's Irish Soda Bread", content: 'Simple and hearty bread for every St. Patricks Day.', recipeIngredients: 'Flour, baking soda, salt, buttermilk, raisins, caraway seeds', recipeInstructions: 'Mix dry ingredients. Stir in buttermilk. Shape into a round, score a cross on top. Bake at 375F for 45 min.', visibility: 'public', tags: ['Irish', 'Baking'], createdAt: '2026-01-05' },
  { id: '5', title: "Mama Chen's Dumplings", content: 'Hand-folded pork and chive dumplings for Lunar New Year.', recipeIngredients: 'Ground pork, Chinese chives, ginger, soy sauce, sesame oil, dumpling wrappers', recipeInstructions: 'Mix filling. Place a tablespoon on each wrapper, fold and pleat. Pan-fry then steam.', visibility: 'followers_only', tags: ['Chinese', 'Lunar New Year'], createdAt: '2026-02-10' },
];

const VISIBILITY_LABELS = {
  public: 'Public',
  followers_only: 'Followers',
  collaborators_only: 'Collaborators',
  private: 'Private',
};

export default function MyRecipesPage() {
  const [queryParams, setQueryParams] = useState({ page: 1, perPage: 10 });
  const { data, isLoading } = useMyRecipes(queryParams);

  const items = data?.data?.length > 0 ? data.data : DUMMY_RECIPES;
  const totalItems = data?.pagination?.total ?? DUMMY_RECIPES.length;
  const usingDummy = !data?.data?.length;

  return (
    <DashboardMainContentLayout title="My Recipes" subtitle={`${totalItems} recipe${totalItems !== 1 ? 's' : ''}${usingDummy ? ' (dummy data)' : ''}`}>
      <DataViewContainer
        items={items}
        loading={isLoading}
        emptyState={{ title: 'No recipes', message: 'You have not added any recipes yet.' }}
        defaultView="card"
        renderCard={(row) => (
          <BaseCard>
            <div className="space-y-3">
              <div className="font-medium text-base-content">{row.title}</div>
              <div className="text-sm text-base-content/70 line-clamp-2">{row.content}</div>
              <div className="text-xs text-base-content/50">
                <span className="font-semibold">Ingredients:</span>{' '}
                <span className="line-clamp-1">{row.recipeIngredients || '\u2014'}</span>
              </div>
              <div className="pt-2 border-t border-base-content/10 flex flex-wrap items-center gap-2 text-xs text-base-content/50">
                <span className="badge badge-ghost badge-sm">{VISIBILITY_LABELS[row.visibility] || row.visibility}</span>
                <span>{row.createdAt}</span>
              </div>
              {row.tags?.length > 0 && (
                <div><span className="text-xs text-base-content/50">Tags:</span> <TagsCell tags={row.tags} /></div>
              )}
            </div>
          </BaseCard>
        )}
        renderRow={(row) => (
          <>
            <td className="px-6 py-4 font-medium">{row.title}</td>
            <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.content}</td>
            <td className="px-6 py-4 text-sm max-w-[150px] truncate">{row.recipeIngredients || '\u2014'}</td>
            <td className="px-6 py-4"><span className="badge badge-ghost badge-sm">{VISIBILITY_LABELS[row.visibility] || row.visibility}</span></td>
            <td className="px-6 py-4"><TagsCell tags={row.tags} /></td>
            <td className="px-6 py-4 text-sm">{row.createdAt}</td>
          </>
        )}
        listHeaders={[
          { label: 'Title', key: 'title', sortable: true },
          { label: 'Description', key: 'content', sortable: false },
          { label: 'Ingredients', key: 'recipeIngredients', sortable: false },
          { label: 'Visibility', key: 'visibility', sortable: true },
          { label: 'Tags', key: 'tags', sortable: false },
          { label: 'Created', key: 'createdAt', sortable: true },
        ]}
        searchPlaceholder="Search recipes..."
        totalItems={totalItems}
        defaultPerPage={10}
        onParamsChange={setQueryParams}
        addNewComponent={<AddNewPlaceholder message="Add new recipe form coming soon." />}
        actions={[
          { key: 'view', label: 'View', icon: <Eye size={16} />, href: () => '#' },
          { key: 'edit', label: 'Edit', icon: <Pencil size={16} />, href: () => '#' },
          { key: 'delete', label: 'Delete', icon: <Trash2 size={16} />, onClick: () => {}, variant: 'danger' },
        ]}
      />
    </DashboardMainContentLayout>
  );
}
