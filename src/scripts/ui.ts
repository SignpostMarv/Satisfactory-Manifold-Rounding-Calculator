import data from '../data.json';
import datasource from '../../third-party/satisfactory-tools/data/data.json';
import {
	LitElement,
	html,
	customElement,
	property,
	TemplateResult,
} from 'lit-element';

const recipes = (datasource.recipes as any) as named_item_dict;
const items = (datasource.items as any) as named_item_dict;

const recipe_keys = Object.keys(recipes);
const item_keys = Object.keys(items);

declare type named_item = {
	className: string,
	name: string
};
declare type named_item_dict = {[key: string]: named_item};
declare type item_categories = 'raw_resources'|'ingots'|'constructables'|'assemblerables'|'manufacturerables'|'refineables'|'handcraftables';

const datamapped = {
	"raw_resources": {} as named_item_dict,
	"ingots": {} as named_item_dict,
	"constructables": {} as named_item_dict,
	"assemblerables": {} as named_item_dict,
	"manufacturerables": {} as named_item_dict,
	"refineables": {} as named_item_dict,
	"handcraftables": {} as named_item_dict,
};

const mappeddata: {[key: string]: item_categories} = {};

const mappedids: string[] = [];

const datamappedlabels = {
	"raw_resources": "Raw Resources",
	"ingots": "Ingots",
	"constructables": "Constructables",
	"assemblerables": "Assemblerables",
	"manufacturerables": "Manufacturerables",
	"refineables": "Refineables",
	"handcraftables": "Handcraftables"
};

(Object.keys(datamapped) as item_categories[]).forEach((category) => {
	data[category].forEach((id) => {
		if (recipe_keys.includes(id)) {
			datamapped[category][id] = (recipes[id] as named_item);
			mappeddata[id] = category;
			mappedids.push(id);
		} else if (item_keys.includes(id)) {
			datamapped[category][id] = (items[id] as named_item);
			mappeddata[id] = category;
			mappedids.push(id);
		} else {
			throw new Error(`could not find ${id} in recipes or items!`);
		}
	});
});

let counter = 0;

@customElement('satisfactory-manifold-rounding-calculator')
export class UserInterface extends LitElement
{
	@property()
	counter: number = 0;

	@property()
	production_plan: WeakMap<named_item, number> = new WeakMap();

	createRenderRoot(): UserInterface
	{
		++counter;

		this.counter = counter;

		return this;
	}

	render(): TemplateResult
	{
		const mappedlabels = (
			Object.entries(datamappedlabels) as [item_categories, string][]
		);

		const item_in_production_plan = (item: named_item) => {
			return this.production_plan.has(item);
		};

		return html`
			<section class="item-list">
				<header>
					<h2>Item Search</h2>
				</header>
				<input
					type="search"
					id="item-search-${this.counter}"
					@keyup=${this.handleItemListSearch}
				>
				<output for="item-search-${this.counter}">
					${mappedlabels.map((entry) => {
						const [id, label] = entry;
						const items = Object.entries(datamapped[id]);

						items.sort((a, b) => {
							return a[1].name.localeCompare(b[1].name);
						});

						return html`
							<section>
								<header>
									<h3>${label}</h3>
								</header>
								<ol class="item-list">
									${items.map((item) => {
										return html`
											<li>
												<button
													type="button"
													value="${item[0]}"
													@click=${this.handleItemClick}
												>${item[1].name}</button>
											</li>
										`;
									})}
								</ol>
							</section>
						`;
					})}
				</output>
			</section>
			<section class="production-planner">
				${mappedlabels.filter((entry) => {
					const [id] = entry;

					return Object.values(datamapped[id]).some(
						item_in_production_plan
					);
				}).map((entry) => {
					const [id, label] = entry;
					const items = Object.values(datamapped[id]).filter(
						item_in_production_plan
					);

					items.sort((a, b) => {
						return a.name.localeCompare(b.name);
					});

					return html`
						<table>
							<caption>${label}</caption>
							<thead>
								<tr>
									<th>Item</th>
									<th>
										<abbr
											title="Units Per Minute"
										>upm</abbr>
									</th>
								</tr>
							</thead>
							<tbody>
								${items.map((item) => {
									return html`
										<tr>
											<th scope="row">
												${item.name}
											</th>
											<td>
												<input
													name="${item.className}"
													value="${
														this.production_plan.get(item)
													}"
													@change=${
														this.handleProductionItemChange
													}
												>
											</td>
										</tr>
									`;
								})}
							</tbody>
						</table>
					`;
				})}
			</section>
		`;
	}

	private handleItemListSearch(e: Event): void
	{
		const search_query = (e.target as HTMLInputElement).value.toLocaleLowerCase();
		const results = (
			(e.target as HTMLInputElement).parentNode as HTMLElement
		).querySelectorAll('output li');

		results.forEach((item) => {
			item.classList.remove('does-not-match-query');

			if ( ! (item.textContent + '').toLocaleLowerCase().includes(search_query)) {
				item.classList.add('does-not-match-query')
			}
		});
	}

	private handleItemClick(e: Event): void
	{
		const value = (e.target as HTMLButtonElement).value;

		if ( ! mappedids.includes(value))
		{
			throw new Error('Could not find item ref!');
		}

		const item = datamapped[mappeddata[value]][value];

		if ( ! this.production_plan.has(item)) {
			this.production_plan.set(item, 0);
		}

		this.requestUpdate();
	}

	private handleProductionItemChange(_e: Event): void
	{
		console.log('not yet implemented');
	}
}
