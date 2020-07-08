const fs = require('fs');

exports.automate_listed = (cb) => {
    const datasource = Object.entries(require(
        './third-party/satisfactory-tools/data/data.json'
    ).recipes).filter((entry) => {
        const [_id, value] = entry;

        return (
            Object.keys(value).includes('producedIn')
            && value.producedIn instanceof Array
            && 1 === value.producedIn.length
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

        target.push(id);

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

exports.unlisted = (cb) => {
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

    const recipes = require(
        './third-party/satisfactory-tools/data/data.json'
    ).recipes;

    const datasource = Object.keys(recipes);

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

    const unlisted = datasource.concat(ingredients).filter(unlisted_filter);

    console.log(`${unlisted.length} items unlisted:\n ${unlisted.join('\n')}`);

    cb();
};
