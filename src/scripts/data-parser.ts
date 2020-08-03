import {
	raw_resources,
	handcraftables,
} from '../manual.json';

abstract class Referenceable
{
	private class_name:string;

	get className(): string
	{
		return this.class_name;
	}

	constructor(class_name:string)
	{
		this.class_name = class_name;
	}
}

class ProductReference extends Referenceable
{
	private _produced_with:RecipeReference[] = [];

	get produced_with() : RecipeReference[]
	{
		return ([] as RecipeReference[]).concat(this._produced_with);
	}

	AddRecipe(recipe:RecipeReference): void
	{
		if ( ! this._produced_with.includes(recipe))
		{
			this._produced_with.push(recipe);

			recipe.AddProduct(this);
		}
	}
}

class RecipeReference extends Referenceable
{
	private _produces:ProductReference[] = [];

	private _uses:ProductReference[];

	get produces() : ProductReference[]
	{
		return ([] as ProductReference[]).concat(this._produces);
	}

	get uses() : ProductReference[]
	{
		return ([] as ProductReference[]).concat(this._uses);
	}

	constructor(class_name:string, uses:ProductReference[])
	{
		super(class_name);

		this._uses = uses;
	}

	AddProduct(product:ProductReference): void
	{
		if ( ! this._produces.includes(product))
		{
			this._produces.push(product);

			product.AddRecipe(this);
		}
	}
}

type Datasource_sanity_level_one =
{
	recipes: any,
	items: any,
};

type Datasource_maybe_recipe =
{
	name: any,
	className: any,
	time: any,
	manualTimeMultiplier: any,
	ingredients: any,
	products: any,
	inMachine: any,
	alternate: any,
};

type Datasource_probably_recipe =
{
	name: string,
	className: string,
	time: number,
	manualTimeMultiplier: number,
	ingredients: any[],
	products: any[],
	inMachine: boolean,
	alternate: boolean,
};

type Datasource_definitely_recipe =
{
	name: string,
	className: string,
	time: number,
	manualTimeMultiplier: number,
	ingredients: Datasource_item_reference[],
	products: Datasource_item_reference[],
	alternate: boolean,
};

type Datasource_maybe_ingredient =
{
	item: any,
	amount: any,
};

type Datasource_maybe_product =
{
	item: any,
	amount: any,
};

type Datasource_maybe_item = {
	name: any,
	className: any,
};

type Datasource_item_reference = {
	item: string,
	amount: number,
};

type Datasource = {
	recipes: {
		[key:string]: Datasource_definitely_recipe,
	},
	items: {
		[key:string]: {
			name: string,
			className: string,
		},
	},
};

type CompiledDatasource_recipe = {
	uses: string[],
	produces: string[],
};

type CompiledDatasource = {
	[key:string]: {[key:string]: CompiledDatasource_recipe}
};

function SanityCheckDatasource(maybe:any): Datasource
{
	const maybe_keys = Object.keys(maybe);

	if (
		! maybe_keys.includes('recipes') ||
		! maybe_keys.includes('items')
	) {
		throw new Error('data source was missing required keys!');
	}

	const recipes_entries = Object.entries(
		(maybe as Datasource_sanity_level_one).recipes
	);

	const items_entries = Object.entries(
		(maybe as Datasource_sanity_level_one).items
	);

	recipes_entries.forEach((entry: [string, any]) => {
		const [key, value] = entry;

		const value_keys = Object.keys(value);

		if (
			! value_keys.includes('name') ||
			! value_keys.includes('className') ||
			! value_keys.includes('time') ||
			! value_keys.includes('manualTimeMultiplier') ||
			! value_keys.includes('ingredients') ||
			! value_keys.includes('products') ||
			! value_keys.includes('inMachine') ||
			! value_keys.includes('alternate')
		) {
			throw new Error(
				`recipe at offset "${key}" was missing required keys!`
			);
		} else if ('string' !== typeof((value as Datasource_maybe_recipe).name)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported name!`
			);
		} else if ('string' !== typeof((value as Datasource_maybe_recipe).className)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported className!`
			);
		} else if ('number' !== typeof((value as Datasource_maybe_recipe).time)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported time!`
			);
		} else if ('number' !== typeof((value as Datasource_maybe_recipe).manualTimeMultiplier)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported manualTimeMultiplier!`
			);
		} else if ( ! ((value as Datasource_maybe_recipe).ingredients instanceof Array)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported ingredients!`
			);
		} else if ( ! ((value as Datasource_maybe_recipe).products instanceof Array)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported products!`
			);
		} else if ('boolean' !== typeof((value as Datasource_maybe_recipe).inMachine)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported inMachine!`
			);
		} else if ('boolean' !== typeof((value as Datasource_maybe_recipe).alternate)) {
			throw new Error(
				`recipe at offset "${key}" has an unsupported alternate!`
			);
		} else if (key !== (value as Datasource_maybe_recipe).className) {
			throw new Error(
				`recipe at offset "${key}" has mismatched className!`
			);
		}

		(value as Datasource_probably_recipe).ingredients.forEach(
			(maybe_ingredient, offset) => {
				const maybe_ingredient_keys = Object.keys(maybe_ingredient);

				if (
					! maybe_ingredient_keys.includes('item') ||
					! maybe_ingredient_keys.includes('amount')
				) {
					throw new Error(
						`recipe at offset "${key}" has an unsupported ingredient at offset ${offset}`
					);
				} else if ('string' !== typeof((maybe_ingredient as Datasource_maybe_ingredient).item)) {
					throw new Error(
						`ingredient at offset ${offset} of recipe at offset "${key}" has an unsupported item!`
					);
				} else if ('number' !== typeof((maybe_ingredient as Datasource_maybe_ingredient).amount)) {
					throw new Error(
						`ingredient at offset ${offset} of recipe at offset "${key}" has an unsupported amount!`
					);
				}
			}
		);

		(value as Datasource_probably_recipe).products.forEach(
			(maybe_product, offset) => {
				const maybe_product_keys = Object.keys(maybe_product);

				if (
					! maybe_product_keys.includes('item') ||
					! maybe_product_keys.includes('amount')
				) {
					throw new Error(
						`recipe at offset "${key}" has an unsupported product at offset ${offset}`
					);
				} else if ('string' !== typeof((maybe_product as Datasource_maybe_product).item)) {
					throw new Error(
						`product at offset ${offset} of recipe at offset "${key}" has an unsupported item!`
					);
				} else if ('number' !== typeof((maybe_product as Datasource_maybe_product).amount)) {
					throw new Error(
						`product at offset ${offset} of recipe at offset "${key}" has an unsupported amount!`
					);
				}
			}
		);
	});

	const item_keys: string[] = [];

	items_entries.forEach((entry: [string, any]) => {
		const [key, value] = entry;

		const value_keys = Object.keys(value);

		if (
			! value_keys.includes('name') ||
			! value_keys.includes('className')
		) {
			throw new Error(
				`item at offset "${key}" was missing required keys!`
			);
		} else if ('string' !== typeof(value as Datasource_maybe_item).name) {
			throw new Error(
				`item at offset "${key}" has an unsupported name!`
			);
		} else if ('string' !== typeof(value as Datasource_maybe_item).className) {
			throw new Error(
				`item at offset "${key}" has an unsupported className!`
			);
		} else if (key !== (value as Datasource_maybe_item).className) {
			throw new Error(
				`item at offset "${key}" has mismatched className!`
			);
		}

		item_keys.push(key);
	});

	const recipes = (Object.values((maybe as Datasource).recipes) as Datasource_probably_recipe[]).filter(
		(recipe) => recipe.inMachine
	) as Datasource_definitely_recipe[];

	recipes.forEach((recipe) => {
		recipe.ingredients.forEach((item) => {
			if ( ! item_keys.includes(item.item)) {
				throw new Error(
					`recipe ${recipe.className} references an ingredient that is not present in the data source!`
				);
			}
		});

		recipe.products.forEach((item) => {
			if ( ! item_keys.includes(item.item)) {
				throw new Error(
					`recipe ${recipe.className} references a product that is not present in the data source!`
				);
			}
		});
	});

	const output:Datasource = {recipes: {}, items:(maybe as Datasource).items};

	recipes.forEach((recipe) => {
		output.recipes[recipe.className] = recipe;
	});

	return output;
}

export function CompileReferences(maybe_datasource:any): {
	defaults: {[key:string]: string},
	data: CompiledDatasource
} {
	const datasource = SanityCheckDatasource(maybe_datasource);

	const recipe_list = Object.values(datasource.recipes);
	const recipes: {[key:string]: RecipeReference} = {};
	const products: {[key:string]: ProductReference} = {};
	const products_to_look_for:string[] = [];
	const output: CompiledDatasource = {};

	function maybe_look_for_product(item: Datasource_item_reference) : void
	{
		if ( ! products_to_look_for.includes(item.item)) {
			products_to_look_for.push(item.item);
		}
	}

	recipe_list.forEach((recipe) => {
		recipe.ingredients.forEach(maybe_look_for_product);
		recipe.products.forEach(maybe_look_for_product);
	});

	products_to_look_for.forEach((product_reference) => {
		products[product_reference] = new ProductReference(product_reference);
	});

	recipe_list.forEach((recipe) => {
		recipes[recipe.className] = new RecipeReference(
			recipe.className,
			recipe.ingredients.map((item): ProductReference => {
				return products[item.item];
			})
		);

		recipe.products.forEach((product) => {
			recipes[recipe.className].AddProduct(products[product.item]);
		});
	});

	function ProductReferenceToClassName(product:ProductReference): string
	{
		return product.className;
	}

	Object.entries(products).forEach((entry) => {
		const [ref, product_ref] = entry;

		output[ref] = {};

		product_ref.produced_with.forEach(
			(recipe): void => {
				output[ref][recipe.className] = {
					uses: recipe.uses.map(ProductReferenceToClassName),
					produces: recipe.produces.map(ProductReferenceToClassName),
				};
			}
		);
	});

	const defaults: {[key:string]: string} = {
		Desc_GenericBiomass_C: 'Recipe_Biomass_Leaves_C',
		Desc_HeavyOilResidue_C: 'Recipe_Rubber_C',
		Desc_CrystalShard_C: 'Recipe_PowerCrystalShard_1_C',
	};

	const default_defaults = Object.keys(defaults);

	Object.entries(output).filter((entry) => {
		const [key] = entry;

		return (
			! default_defaults.includes(key) &&
			! raw_resources.includes(key) &&
			! handcraftables.includes(key)
		);
	}).forEach((entry) => {
		const [key, value] = entry;

		const value_keys = Object.keys(value);

		const not_alternates = value_keys.filter(
			(recipe_reference) => {
				return ! datasource.recipes[recipe_reference].alternate;
			}
		);

		const not_residuals = not_alternates.filter(
			(recipe_reference) => {
				return ! /residual/i.test(recipe_reference);
			}
		);

		const sole_product = not_alternates.filter(
			(recipe_reference) => {
				return 1 === recipes[recipe_reference].produces.length;
			}
		);

		if (
			1 !== value_keys.length &&
			1 !== not_alternates.length &&
			1 !== not_residuals.length &&
			1 !== sole_product.length
		) {
			throw new Error(
				`item ${key} does not have a default recipe!`
			);
		} else if (1 === value_keys.length) {
			defaults[key] = value_keys[0];
		} else {
			defaults[key] = 1 === not_alternates.length ? not_alternates[0] : (1 === not_residuals.length ? not_residuals[0] : sole_product[0]);
		}
	});

	return {
		defaults,
		data: output,
	};
}

export default CompileReferences;
