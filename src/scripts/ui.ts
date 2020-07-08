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

declare type named_item = {name: string};
declare type named_item_dict = {[key: string]: named_item};

const datamapped = {
	"raw_resources": {} as named_item_dict,
	"ingots": {} as named_item_dict,
	"constructables": {} as named_item_dict,
	"assemblerables": {} as named_item_dict,
	"manufacturerables": {} as named_item_dict,
	"refineables": {} as named_item_dict,
	"handcraftables": {} as named_item_dict,
};

const datamappedlabels = {
	"raw_resources": "Raw Resources",
	"ingots": "Ingots",
	"constructables": "Constructables",
	"assemblerables": "Assemblerables",
	"manufacturerables": "Manufacturerables",
	"refineables": "Refineables",
	"handcraftables": "Handcraftables"
};

(Object.keys(datamapped) as ('raw_resources'|'ingots'|'constructables'|'assemblerables'|'manufacturerables'|'refineables'|'handcraftables')[]).forEach((category) => {
	data[category].forEach((id) => {
		if (recipe_keys.includes(id)) {
			datamapped[category][id] = (recipes[id] as named_item);
		} else if (item_keys.includes(id)) {
			datamapped[category][id] = (items[id] as named_item);
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

	createRenderRoot(): UserInterface
	{
		++counter;

		this.counter = counter;

		return this;
	}

	render(): TemplateResult
	{
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
					${(Object.entries(datamappedlabels) as ['raw_resources'|'ingots'|'constructables'|'assemblerables'|'manufacturerables'|'refineables'|'handcraftables', string][]).map((entry) => {
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
}
