const fs = require('fs');
const rollup = require('rollup');
const {
	src,
	dest,
	series,
	parallel,
} = require('gulp');
const newer = require('gulp-newer');
const uglify = require('gulp-uglify-es').default;
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');

const rollupPlugins = {
	commonjs: require('@rollup/plugin-commonjs'),
	nodeResolve: require('@rollup/plugin-node-resolve').default,
	jsonResolve: require('@rollup/plugin-json'),
	typescript: require('@rollup/plugin-typescript'),
	minifyHtml: require('rollup-plugin-minify-html-literals').default,
};

const postcss_plugins = {
	nested: require('postcss-nested'),
	calc: require('postcss-nested'),
	font_family_system_ui: require('postcss-font-family-system-ui'),
	system_monospace: require('postcss-system-monospace'),
	cssnano: require('cssnano'),
	import: require('postcss-import'),
};

const postcss_config = () => {
	return postcss([
		postcss_plugins.import(),
		postcss_plugins.nested(),
		postcss_plugins.calc(),
		postcss_plugins.font_family_system_ui(),
		postcss_plugins.system_monospace(),
		postcss_plugins.cssnano({
			cssDeclarationSorter: 'concentric-css',
		}),
	]);
};

function automate_listed(cb) {
	const datasource = Object.entries(require(
		'./third-party/satisfactory-tools/data/data.json'
	).recipes).filter((entry) => {
		const [_id, value] = entry;

		return (
			Object.keys(value).includes('producedIn')
			&& value.producedIn instanceof Array
			&& 1 === value.producedIn.length
			&& (
				! Object.keys(value).includes('alternate')
				|| ! value.alternate
			)
		);
	});

	const data = require('./src/manual.json');

	datasource.forEach((entry) => {
		const [id, value] = entry;

		let target = [];

		if (value.producedIn.includes('Desc_AssemblerMk1_C')) {
			target = data.assemblerables;
		} else if (value.producedIn.includes('Desc_ManufacturerMk1_C')) {
			target = data.manufacturerables;
		} else if (value.producedIn.includes('Desc_ConstructorMk1_C')) {
			target = data.constructables;
		} else if (value.producedIn.includes('Desc_OilRefinery_C')) {
			target = data.refineables;
		} else if (
			value.producedIn.includes('Desc_FoundryMk1_C')
			|| value.producedIn.includes('Desc_SmelterMk1_C')
		) {
			target = data.ingots;
		}

		if (Object.keys(value).includes('products')) {
			value.products.forEach((product) => {
				if ( ! target.includes(product.item)) {
					target.push(product.item);
				}
			});
		}
	});

	fs.writeFileSync(
		'./src/data.json',
		JSON.stringify(
			Object.fromEntries(Object.entries(data).map((entry) => {
				const [id, values] = entry;

				values.sort();

				return [id, values];
			})),
			null,
			'\t'
		)
	);

	cb();
};

function unlisted(cb) {
	const listed = Object.values(require('./src/data.json')).reduce(
		(prev, current) => {
			current.forEach((id) => {
				if ( ! prev.includes(id)) {
					prev.push(id);
				}
			});

			return prev;
		},
		[]
	);
	const excluded = require('./src/excluded.json');

	const datasource = require(
		'./third-party/satisfactory-tools/data/data.json'
	);

	const recipes = datasource.recipes;

	const ingredients = Object.entries(recipes).reduce(
		(prev, entry) => {
			const [id, value] = entry;

			if (Object.keys(value).includes('ingredients')) {
				value.ingredients.forEach((ingredient) => {
					if ( ! prev.includes(ingredient.item)) {
						prev.push(ingredient.item);
					}
				});
			}

			return prev;
		},
		[]
	).filter((id) => {
		return ! excluded.includes(id);
	});

	const unlisted_filter = (id) => {
		return ! listed.includes(id) && ! excluded.includes(id);
	};

	const unlisted = Object.keys(datasource.items).concat(ingredients).filter(unlisted_filter);

	console.log(`${unlisted.length} items unlisted:\n ${unlisted.join('\n')}`);

	cb();
};

async function js_load(cb) {
	const bundle = await rollup.rollup({
		input: './src/scripts/load.ts',
		plugins: [
			rollupPlugins.nodeResolve(),
			rollupPlugins.jsonResolve(),
			rollupPlugins.typescript({
				tsconfig: './tsconfig.json',
				outDir: './tmp/scripts/',
			}),
			rollupPlugins.minifyHtml(),
		],
	});

	await bundle.write({
		sourcemap: false,
		format: 'es',
		dir: './tmp/scripts/',
	});

	cb();
};

async function js_data_parse_cjs(cb) {
	const bundle = await rollup.rollup({
		input: './src/scripts/data-parser.cjs.ts',
		plugins: [
			rollupPlugins.nodeResolve(),
			rollupPlugins.jsonResolve(),
			rollupPlugins.typescript({
				tsconfig: './tsconfig.json',
				outDir: './src/scripts/',
			}),
			rollupPlugins.minifyHtml(),
		],
	});

	await bundle.write({
		sourcemap: false,
		format: 'cjs',
		dir: './src/scripts/',
		exports: 'named',
	});

	cb();
};

async function js_data_parse(cb) {
	const bundle = await rollup.rollup({
		input: './src/scripts/data-parser.ts',
		plugins: [
			rollupPlugins.nodeResolve(),
			rollupPlugins.jsonResolve(),
			rollupPlugins.typescript({
				tsconfig: './tsconfig.json',
				outDir: './src/scripts/',
			}),
			rollupPlugins.minifyHtml(),
		],
	});

	await bundle.write({
		sourcemap: false,
		format: 'es',
		dir: './src/scripts/',
	});

	cb();
};

async function graph_datasource(cb) {
	const maybe = require(
		'./third-party/satisfactory-tools/data/data.json'
	);

	const {CompileReferences} = require(
		'./src/scripts/data-parser.cjs.js'
	);

	fs.writeFileSync(
		'./src/graphed.json',
		JSON.stringify(
			CompileReferences(maybe),
			null,
			'\t'
		)
	);
};

function task_uglify() {
	return src('./tmp/scripts/**/*.js').pipe(
		newer('./src/scripts/')
	).pipe(
		uglify({
			module: true,
		})
	).pipe(dest('./src/scripts/'));
};

function task_postcss() {
	return src('./src/css/**/*.postcss').pipe(
		postcss_config()
	).pipe(
		rename({extname: '.css'})
	).pipe(dest('./src/css/'));
};

exports.automate_listed = automate_listed;
exports.unlisted = unlisted;
exports.js_load = js_load;
exports.js_data_parse_cjs = js_data_parse_cjs;
exports.js_data_parse = js_data_parse;
exports.graph_datasource = graph_datasource;
exports.uglify = task_uglify;
exports.postcss = task_postcss;

exports.default = series(...[
	js_data_parse_cjs,
	graph_datasource,
	parallel(...[
		js_load,
		task_postcss,
	]),
	task_uglify,
]);
